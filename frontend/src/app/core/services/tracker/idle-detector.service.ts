import { Injectable } from '@angular/core';
import { IdleInputType } from '../../models/tracker.models';

/**
 * Per-input-type idle thresholds (ms). Each input runs its OWN countdown;
 * the session is idle only when ALL channels have expired.
 */
export const IDLE_THRESHOLDS: Readonly<Record<IdleInputType, number>> = {
  keyboard: 8 * 60 * 1000, // typing notes
  scroll: 6 * 60 * 1000, // reading / analyzing
  mouse: 4 * 60 * 1000, // light interaction
  copy: 6 * 60 * 1000, // extracting data
  default: 5 * 60 * 1000, // fallback / session baseline
};

/**
 * Smart idle detector. Tracks a deadline per input channel; the user is
 * considered idle once `now` passes the latest deadline across all channels.
 *
 * Stateless w.r.t. timers — the orchestrator polls {@link isIdle} on its tick,
 * so there are no internal intervals to clean up.
 */
@Injectable({ providedIn: 'root' })
export class IdleDetectorService {
  /** Per-channel expiry timestamps (ms epoch). */
  private deadlines = new Map<IdleInputType, number>();

  /**
   * Seed a baseline so a freshly-started session counts as active.
   * @param now Current epoch ms.
   */
  reset(now: number = Date.now()): void {
    this.deadlines.clear();
    this.deadlines.set('default', now + IDLE_THRESHOLDS.default);
  }

  /**
   * Register activity on a channel, extending that channel's deadline.
   * @param input The input channel that fired.
   * @param now Current epoch ms.
   */
  registerActivity(input: IdleInputType, now: number = Date.now()): void {
    this.deadlines.set(input, now + IDLE_THRESHOLDS[input]);
  }

  /**
   * Whether ALL channels have expired (i.e. the session is idle).
   * @param now Current epoch ms.
   */
  isIdle(now: number = Date.now()): boolean {
    let latest = 0;
    for (const deadline of this.deadlines.values()) {
      if (deadline > latest) latest = deadline;
    }
    return now >= latest;
  }

  /** Ms until the session goes idle (0 if already idle). */
  msUntilIdle(now: number = Date.now()): number {
    let latest = 0;
    for (const deadline of this.deadlines.values()) {
      if (deadline > latest) latest = deadline;
    }
    return Math.max(0, latest - now);
  }
}
