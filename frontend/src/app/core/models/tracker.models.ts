/**
 * Shared types for the engagement tracker pipeline.
 * Mirrors the NestJS DTOs (tracking module).
 */

/** The 10 raw event types persisted to `usage_events`. */
export type TrackedEventType =
  | 'click'
  | 'scroll'
  | 'keydown'
  | 'copy'
  | 'select'
  | 'visibility'
  | 'focus'
  | 'wheel'
  | 'mousestop'
  | 'view';

/** Component types for view-count tracking. */
export type ComponentType = 'report' | 'dashboard' | 'dashboard_page' | 'dataset' | 'visual';

/** Idle "channels" — each input type runs its own countdown. */
export type IdleInputType = 'keyboard' | 'scroll' | 'mouse' | 'copy' | 'default';

/** A raw event buffered between flushes. */
export interface EventEntry {
  eventType: TrackedEventType;
  eventData?: Record<string, unknown>;
  timestamp: string; // ISO 8601
}

/** Identity + context of the current tracking session. */
export interface SessionContext {
  sessionId: string;
  userId: string;
  dashboardId: string;
  tabName: string;
  department?: string;
}

/** Body of `POST /api/tracking/session/start`. */
export interface StartSessionPayload {
  sessionId: string;
  userId: string;
  dashboardId: string;
  tabName?: string;
  department?: string;
  startedAt: string; // ISO 8601
}

/** Body of `POST /api/tracking/session/flush`. */
export interface FlushPayload {
  sessionId: string;
  dashboardId: string;
  tabName: string;
  userId: string;
  department?: string;
  engagedSeconds: number;
  clickCount: number;
  scrollCount: number;
  copyCount: number;
  keydownCount: number;
  selectCount: number;
  isEnding: boolean;
  idleExpired?: boolean;
  timestamp: string; // ISO 8601
  events?: EventEntry[];
}

/** Body of `POST /api/tracking/view`. */
export interface LogViewPayload {
  userId: string;
  componentType: ComponentType;
  componentId: string;
  componentName: string;
  workspaceId?: string;
  sessionId: string;
  timestamp: string; // ISO 8601
}
