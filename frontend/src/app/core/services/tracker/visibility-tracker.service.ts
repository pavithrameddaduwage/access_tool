import { Injectable } from '@angular/core';

/**
 * Page Visibility API wrapper. Fires callbacks when the tab is hidden/shown
 * (user switches browser tabs). The single pause gate lives in TrackerService —
 * this service only reports transitions.
 */
@Injectable({ providedIn: 'root' })
export class VisibilityTrackerService {
  private handler: (() => void) | null = null;

  /**
   * Start listening for visibility changes.
   * @param onHidden Called when the tab becomes hidden.
   * @param onVisible Called when the tab becomes visible again.
   */
  init(onHidden: () => void, onVisible: () => void): void {
    this.destroy();
    this.handler = () => {
      if (document.hidden) onHidden();
      else onVisible();
    };
    document.addEventListener('visibilitychange', this.handler);
  }

  /** Whether the tab is currently hidden. */
  isHidden(): boolean {
    return document.hidden;
  }

  /** Remove the visibility listener. */
  destroy(): void {
    if (this.handler) {
      document.removeEventListener('visibilitychange', this.handler);
      this.handler = null;
    }
  }
}
