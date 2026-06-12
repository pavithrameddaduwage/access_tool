import { Injectable, signal } from '@angular/core';
import { SessionContext } from '../../models/tracker.models';

/**
 * Owns session identity: generates the session UUID, tracks the current
 * dashboard/tab/user context, and exposes it as a signal.
 */
@Injectable({ providedIn: 'root' })
export class SessionService {
  /** Current session context, or null between sessions (e.g. after idle expiry). */
  readonly context = signal<SessionContext | null>(null);

  /**
   * Begin a fresh session with a new UUID.
   * @returns The new session context.
   */
  startNew(params: {
    userId: string;
    dashboardId: string;
    tabName: string;
    department?: string;
  }): SessionContext {
    const ctx: SessionContext = {
      sessionId: this.uuid(),
      userId: params.userId,
      dashboardId: params.dashboardId,
      tabName: params.tabName,
      department: params.department,
    };
    this.context.set(ctx);
    return ctx;
  }

  /** Update the active tab name (Angular route change within a dashboard). */
  setTabName(tabName: string): void {
    const ctx = this.context();
    if (ctx) this.context.set({ ...ctx, tabName });
  }

  /** Clear the session (after finalize / idle expiry). */
  clear(): void {
    this.context.set(null);
  }

  /** The current session id, or null. */
  currentId(): string | null {
    return this.context()?.sessionId ?? null;
  }

  /**
   * RFC4122 v4 UUID. Uses `crypto.randomUUID` when available, with a
   * `getRandomValues` fallback for older browsers.
   */
  private uuid(): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID();
    }
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0'));
    return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex
      .slice(6, 8)
      .join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10, 16).join('')}`;
  }
}
