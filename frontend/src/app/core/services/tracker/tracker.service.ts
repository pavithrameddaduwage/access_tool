import { Injectable, OnDestroy } from '@angular/core';
import { SessionService } from './session.service';
import { IdleDetectorService } from './idle-detector.service';
import { VisibilityTrackerService } from './visibility-tracker.service';
import { WindowFocusTrackerService } from './window-focus-tracker.service';
import { EventCollectorService, CollectedEvent, CounterField } from './event-collector.service';
import { FlushService } from './flush.service';
import {
  ComponentType,
  EventEntry,
  FlushPayload,
  SessionContext,
  TrackedEventType,
} from '../../models/tracker.models';

/** Engaged-time tick resolution. */
const TICK_INTERVAL_MS = 1000;
/** Flush cadence. */
const FLUSH_INTERVAL_MS = 30_000;

interface StartParams {
  userId: string;
  dashboardId: string;
  tabName: string;
  department?: string;
}

/** Mutable per-session accumulator (counts are cumulative session totals). */
interface SessionState {
  engagedSeconds: number;
  click: number;
  scroll: number;
  copy: number;
  keydown: number;
  select: number;
  buffer: EventEntry[];
}

/**
 * Orchestrates the engagement tracker.
 *
 * Owns engaged-time accounting (1s tick), the single `isPaused` gate (tab hidden
 * OR window blurred — never double-paused), idle detection, the 30s flush cycle,
 * the idle-expiry→new-session lifecycle, and view logging. Delegates concerns to
 * the idle/visibility/focus/collector/flush/session services.
 */
@Injectable({ providedIn: 'root' })
export class TrackerService implements OnDestroy {
  private params: StartParams | null = null;
  private state: SessionState = this.emptyState();

  // Pause sources — the gate is `tabHidden || windowBlurred`.
  private tabHidden = false;
  private windowBlurred = false;

  // Lifecycle flags.
  private awaitingActivity = false; // true after idle expiry, before next session
  private flushing = false;

  private tickHandle: ReturnType<typeof setInterval> | null = null;
  private flushHandle: ReturnType<typeof setInterval> | null = null;
  private beforeUnloadHandler: (() => void) | null = null;

  constructor(
    private session: SessionService,
    private idle: IdleDetectorService,
    private visibility: VisibilityTrackerService,
    private focus: WindowFocusTrackerService,
    private collector: EventCollectorService,
    private flushService: FlushService,
  ) {}

  // ─── Public API ─────────────────────────────────────────────────────────────

  /**
   * Start tracking a dashboard. Generates a session, attaches listeners, and
   * starts the engaged-time tick + 30s flush cycle.
   */
  startTracking(params: StartParams): void {
    this.stopTracking(); // idempotent: clean any prior session
    this.params = params;
    void this.openSession();

    this.collector.start((e) => this.onEvent(e));
    this.visibility.init(
      () => this.setTabHidden(true),
      () => this.setTabHidden(false),
    );
    this.focus.init(
      () => this.setWindowBlurred(true),
      () => this.setWindowBlurred(false),
    );

    this.tickHandle = setInterval(() => this.onTick(), TICK_INTERVAL_MS);
    this.flushHandle = setInterval(() => void this.doFlush(false), FLUSH_INTERVAL_MS);

    this.beforeUnloadHandler = () => this.finalizeBeacon();
    window.addEventListener('beforeunload', this.beforeUnloadHandler);
  }

  /** Finalize the active session and tear everything down. */
  stopTracking(): void {
    if (this.session.currentId()) void this.doFlush(true);
    this.teardown();
  }

  /**
   * Handle navigation to a different dashboard: end the current session, log the
   * view for the new component, and start a fresh session.
   */
  handleDashboardChange(params: StartParams, view?: {
    componentType: ComponentType;
    componentId: string;
    componentName: string;
    workspaceId?: string;
  }): void {
    if (this.session.currentId()) void this.doFlush(true);
    this.teardown();
    if (view) void this.logView(view.componentType, view.componentId, view.componentName, view.workspaceId);
    this.startTracking(params);
  }

  /** Update the active tab name (route change within a dashboard). */
  setTabName(tabName: string): void {
    if (this.params) this.params = { ...this.params, tabName };
    this.session.setTabName(tabName);
  }

  /** Log a component view (upserts component_view_counts on the backend). */
  async logView(
    componentType: ComponentType,
    componentId: string,
    componentName: string,
    workspaceId?: string,
  ): Promise<void> {
    const ctx = this.session.context();
    if (!ctx) return;
    // Also buffer a raw 'view' event for the session timeline.
    this.bufferEvent('view', { componentType, componentId, componentName });
    try {
      await this.flushService.logView({
        userId: ctx.userId,
        componentType,
        componentId,
        componentName,
        workspaceId,
        sessionId: ctx.sessionId,
        timestamp: new Date().toISOString(),
      });
    } catch {
      /* view logging is best-effort */
    }
  }

  ngOnDestroy(): void {
    this.stopTracking();
  }

  // ─── Session lifecycle ────────────────────────────────────────────────────────

  private async openSession(): Promise<void> {
    if (!this.params) return;
    this.state = this.emptyState();
    this.idle.reset();
    this.awaitingActivity = false;
    const ctx = this.session.startNew(this.params);
    try {
      await this.flushService.start({
        sessionId: ctx.sessionId,
        userId: ctx.userId,
        dashboardId: ctx.dashboardId,
        tabName: ctx.tabName,
        department: ctx.department,
        startedAt: new Date().toISOString(),
      });
    } catch {
      /* start is best-effort; first flush will upsert the row anyway */
    }
  }

  /** All idle channels expired → finalize the session; await next activity. */
  private onIdleExpired(): void {
    if (!this.session.currentId()) return;
    void this.doFlush(true, true);
    this.session.clear();
    this.awaitingActivity = true;
  }

  // ─── Event handling ─────────────────────────────────────────────────────────────

  private onEvent(e: CollectedEvent): void {
    // First activity after an idle cutoff starts a brand-new session.
    if (this.awaitingActivity) void this.openSession();

    if (e.idleInput) this.idle.registerActivity(e.idleInput);
    if (e.counter) this.incrementCounter(e.counter);
    if (e.buffer && e.eventType) this.bufferEvent(e.eventType, e.data);
  }

  private incrementCounter(counter: CounterField): void {
    this.state[counter] += 1;
  }

  private bufferEvent(eventType: TrackedEventType, data?: Record<string, unknown>): void {
    this.state.buffer.push({ eventType, eventData: data, timestamp: new Date().toISOString() });
  }

  // ─── Pause gate (single isPaused = tabHidden || windowBlurred) ──────────────────

  private setTabHidden(hidden: boolean): void {
    this.tabHidden = hidden;
    this.bufferEvent('visibility', { state: hidden ? 'hidden' : 'visible' });
  }

  private setWindowBlurred(blurred: boolean): void {
    this.windowBlurred = blurred;
    this.bufferEvent('focus', { state: blurred ? 'blur' : 'focus' });
  }

  private isPaused(): boolean {
    return this.tabHidden || this.windowBlurred;
  }

  // ─── Ticks ────────────────────────────────────────────────────────────────────

  private onTick(): void {
    // Idle expiry can fire even while paused (e.g. tab hidden for >8 min).
    if (this.session.currentId() && this.idle.isIdle()) {
      this.onIdleExpired();
      return;
    }
    if (!this.session.currentId()) return;
    if (this.isPaused()) return; // paused time never counts
    this.state.engagedSeconds += 1;
  }

  // ─── Flush ────────────────────────────────────────────────────────────────────

  private async doFlush(isEnding: boolean, idleExpired = false): Promise<void> {
    const ctx = this.session.context();
    if (!ctx || this.flushing) return;
    this.flushing = true;
    const payload = this.buildPayload(ctx, isEnding, idleExpired);
    // Take the buffered events for this flush; clear so they aren't re-sent.
    const sending = payload.events ?? [];
    this.state.buffer = [];
    try {
      await this.flushService.flush(payload);
    } catch {
      // Re-queue events on failure so they are retried on the next flush.
      this.state.buffer = [...sending, ...this.state.buffer];
    } finally {
      this.flushing = false;
    }
  }

  /** Unload path: best-effort beacon flush with isEnding=true. */
  private finalizeBeacon(): void {
    const ctx = this.session.context();
    if (!ctx) return;
    this.flushService.flushBeacon(this.buildPayload(ctx, true, false));
  }

  private buildPayload(ctx: SessionContext, isEnding: boolean, idleExpired: boolean): FlushPayload {
    return {
      sessionId: ctx.sessionId,
      dashboardId: ctx.dashboardId,
      tabName: ctx.tabName,
      userId: ctx.userId,
      department: ctx.department,
      engagedSeconds: this.state.engagedSeconds,
      clickCount: this.state.click,
      scrollCount: this.state.scroll,
      copyCount: this.state.copy,
      keydownCount: this.state.keydown,
      selectCount: this.state.select,
      isEnding,
      idleExpired,
      timestamp: new Date().toISOString(),
      events: this.state.buffer.slice(),
    };
  }

  // ─── Teardown ─────────────────────────────────────────────────────────────────

  private teardown(): void {
    if (this.tickHandle) clearInterval(this.tickHandle);
    if (this.flushHandle) clearInterval(this.flushHandle);
    this.tickHandle = null;
    this.flushHandle = null;
    this.collector.stop();
    this.visibility.destroy();
    this.focus.destroy();
    if (this.beforeUnloadHandler) {
      window.removeEventListener('beforeunload', this.beforeUnloadHandler);
      this.beforeUnloadHandler = null;
    }
    this.session.clear();
    this.tabHidden = false;
    this.windowBlurred = false;
    this.awaitingActivity = false;
  }

  private emptyState(): SessionState {
    return { engagedSeconds: 0, click: 0, scroll: 0, copy: 0, keydown: 0, select: 0, buffer: [] };
  }
}
