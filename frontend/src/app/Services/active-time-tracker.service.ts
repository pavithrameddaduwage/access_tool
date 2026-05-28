import { Injectable, OnDestroy } from '@angular/core';
import { PowerBIMetricsService } from './powerbi-metrics.service';
import { AuthService } from '../Auth/services/auth.service';

export interface TrackingContext {
  reportId: string;
  reportName: string;
  tabName: string;
  workspaceId?: string;
  workspaceName?: string;
}

@Injectable({ providedIn: 'root' })
export class ActiveTimeTrackerService implements OnDestroy {
  private readonly IDLE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes of no activity = idle

  private context: TrackingContext | null = null;
  private activeSeconds = 0;
  private lastActivityTime = Date.now();
  private lastTickTime = Date.now();
  private isIdle = false;
  private isTracking = false;

  private tickHandle: ReturnType<typeof setInterval> | null = null;
  private removeActivityListeners: (() => void) | null = null;

  constructor(
    private powerBIMetricsService: PowerBIMetricsService,
    private authService: AuthService
  ) {}

  startTracking(context: TrackingContext): void {
    this.stopTick();
    this.context = context;
    this.activeSeconds = 0;
    this.lastActivityTime = Date.now();
    this.lastTickTime = Date.now();
    this.isIdle = false;
    this.isTracking = true;
    this.attachActivityListeners();
    this.startTick();
  }

  switchContext(newContext: TrackingContext): void {
    this.flush();
    this.context = newContext;
    this.activeSeconds = 0;
    this.lastTickTime = Date.now();
  }

  flush(): void {
    if (!this.isTracking || !this.context || this.activeSeconds <= 0) return;

    const email = this.authService.userSubject?.value?.email;
    if (!email) return;

    const seconds = this.activeSeconds;
    this.activeSeconds = 0;
    this.lastTickTime = Date.now();

    this.powerBIMetricsService.recordTimeSpent(
      email,
      this.context.reportId,
      this.context.reportName,
      this.context.tabName,
      seconds,
      this.context.workspaceId,
      this.context.workspaceName
    ).subscribe({ error: (err) => console.error('Telemetry flush error:', err) });
  }

  stop(): void {
    this.flush();
    this.isTracking = false;
    this.stopTick();
    this.detachActivityListeners();
  }

  ngOnDestroy(): void {
    this.stop();
  }

  private tick(): void {
    const now = Date.now();
    const elapsedSec = (now - this.lastTickTime) / 1000;
    this.lastTickTime = now;

    const idleDuration = now - this.lastActivityTime;
    const wasIdle = this.isIdle;
    this.isIdle = idleDuration > this.IDLE_THRESHOLD_MS;

    if (wasIdle && !this.isIdle) {
      // User just came back from idle — don't count the gap; tick already reset above
      return;
    }

    if (!this.isIdle && !document.hidden) {
      this.activeSeconds += Math.round(elapsedSec);
    }
  }

  private onActivity(): void {
    const wasIdle = this.isIdle;
    this.lastActivityTime = Date.now();

    if (wasIdle) {
      // Resume after idle: reset tick baseline so gap isn't counted
      this.lastTickTime = Date.now();
      this.isIdle = false;
    }
  }

  private attachActivityListeners(): void {
    const handler = () => this.onActivity();
    const events = ['mousemove', 'click', 'keydown', 'scroll', 'touchstart'] as const;
    events.forEach(e => document.addEventListener(e, handler, { passive: true }));
    this.removeActivityListeners = () =>
      events.forEach(e => document.removeEventListener(e, handler));
  }

  private detachActivityListeners(): void {
    this.removeActivityListeners?.();
    this.removeActivityListeners = null;
  }

  private startTick(): void {
    this.tickHandle = setInterval(() => this.tick(), 1000);
  }

  private stopTick(): void {
    if (this.tickHandle !== null) {
      clearInterval(this.tickHandle);
      this.tickHandle = null;
    }
  }
}
