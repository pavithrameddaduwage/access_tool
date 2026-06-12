import { Injectable } from '@angular/core';

/**
 * Window focus tracker (alt-tab to Outlook/Teams/etc.).
 *
 * Holds its own `isPaused` so blur/focus fire their callbacks at most once per
 * transition; the authoritative engaged-time pause gate is still the single
 * `isPaused` boolean in TrackerService (Rule 5: no double-pause).
 */
@Injectable({ providedIn: 'root' })
export class WindowFocusTrackerService {
  private isPaused = false;
  private blurHandler: (() => void) | null = null;
  private focusHandler: (() => void) | null = null;

  /**
   * Start listening for window blur/focus.
   * @param onPause Called once when the window loses focus.
   * @param onResume Called once when the window regains focus.
   */
  init(onPause: () => void, onResume: () => void): void {
    this.destroy();
    this.blurHandler = () => {
      if (!this.isPaused) {
        this.isPaused = true;
        onPause();
      }
    };
    this.focusHandler = () => {
      if (this.isPaused) {
        this.isPaused = false;
        onResume();
      }
    };
    window.addEventListener('blur', this.blurHandler);
    window.addEventListener('focus', this.focusHandler);
  }

  /** Remove blur/focus listeners. */
  destroy(): void {
    if (this.blurHandler) window.removeEventListener('blur', this.blurHandler);
    if (this.focusHandler) window.removeEventListener('focus', this.focusHandler);
    this.blurHandler = null;
    this.focusHandler = null;
    this.isPaused = false;
  }
}
