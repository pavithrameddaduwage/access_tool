import { Injectable } from '@angular/core';
import { IdleInputType, TrackedEventType } from '../../models/tracker.models';

/** Counter fields on the session summary. */
export type CounterField = 'click' | 'scroll' | 'copy' | 'keydown' | 'select';

/** A normalized collected event handed to the orchestrator. */
export interface CollectedEvent {
  /** Stored event type, or null for pure idle-reset signals (raw mousemove). */
  eventType: TrackedEventType | null;
  /** Idle channel to reset, or null. */
  idleInput: IdleInputType | null;
  /** Session counter to increment, or null. */
  counter: CounterField | null;
  /** Whether to buffer this as a raw event for the next flush. */
  buffer: boolean;
  /** Optional metadata. */
  data?: Record<string, unknown>;
}

/** Delay after the mouse stops before emitting a `mousestop` event (ms). */
const MOUSESTOP_DEBOUNCE_MS = 2000;

/**
 * Attaches DOM listeners for the interaction events and normalizes them into
 * {@link CollectedEvent}s. Visibility and window focus/blur are owned by their
 * dedicated trackers, so they are NOT attached here (avoids double handling).
 *
 * Mouse movement is high-frequency: it only resets the idle channel (no buffer);
 * a single `mousestop` event is emitted once movement pauses (the "reading" signal).
 */
@Injectable({ providedIn: 'root' })
export class EventCollectorService {
  private removers: Array<() => void> = [];
  private mouseStopTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * Start collecting. Each normalized event is passed to `emit`.
   * @param emit Receiver for normalized events.
   */
  start(emit: (event: CollectedEvent) => void): void {
    this.stop();

    this.on(document, 'click', () =>
      emit({ eventType: 'click', idleInput: 'mouse', counter: 'click', buffer: true }),
    );
    this.on(document, 'scroll', () =>
      emit({ eventType: 'scroll', idleInput: 'scroll', counter: 'scroll', buffer: true }), true);
    this.on(window, 'wheel', () =>
      emit({ eventType: 'wheel', idleInput: 'scroll', counter: 'scroll', buffer: true }), true);
    this.on(document, 'keydown', () =>
      emit({ eventType: 'keydown', idleInput: 'keyboard', counter: 'keydown', buffer: true }));
    this.on(document, 'copy', () =>
      emit({ eventType: 'copy', idleInput: 'copy', counter: 'copy', buffer: true }));
    this.on(document, 'selectionchange', () =>
      emit({ eventType: 'select', idleInput: 'mouse', counter: 'select', buffer: true }));

    // Mouse movement: reset idle only; schedule a single mousestop emit.
    this.on(document, 'mousemove', () => {
      emit({ eventType: null, idleInput: 'mouse', counter: null, buffer: false });
      this.scheduleMouseStop(emit);
    });
  }

  /** Remove all listeners and clear pending timers. */
  stop(): void {
    for (const remove of this.removers) remove();
    this.removers = [];
    if (this.mouseStopTimer) {
      clearTimeout(this.mouseStopTimer);
      this.mouseStopTimer = null;
    }
  }

  private scheduleMouseStop(emit: (event: CollectedEvent) => void): void {
    if (this.mouseStopTimer) clearTimeout(this.mouseStopTimer);
    this.mouseStopTimer = setTimeout(() => {
      emit({ eventType: 'mousestop', idleInput: 'mouse', counter: null, buffer: true });
    }, MOUSESTOP_DEBOUNCE_MS);
  }

  private on(
    target: Document | Window,
    type: string,
    handler: () => void,
    passive = false,
  ): void {
    const opts: AddEventListenerOptions = { passive };
    target.addEventListener(type, handler, opts);
    this.removers.push(() => target.removeEventListener(type, handler, opts));
  }
}
