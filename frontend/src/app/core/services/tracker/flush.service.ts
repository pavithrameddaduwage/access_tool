import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  FlushPayload,
  LogViewPayload,
  StartSessionPayload,
} from '../../models/tracker.models';

/** Tracking API base (environment.apiUrl already ends with '/'). */
const TRACKING_BASE = `${environment.apiUrl}api/tracking`;

/**
 * Transport for the tracker: session start/flush and view logging over
 * HttpClient, plus a `sendBeacon` path for the page-unload flush (which must
 * survive the document being torn down).
 */
@Injectable({ providedIn: 'root' })
export class FlushService {
  constructor(private http: HttpClient) {}

  /** Create the session row when tracking starts. */
  async start(payload: StartSessionPayload): Promise<void> {
    await firstValueFrom(this.http.post(`${TRACKING_BASE}/session/start`, payload));
  }

  /** Send a flush (counters + buffered events). Used on the 30s interval. */
  async flush(payload: FlushPayload): Promise<void> {
    await firstValueFrom(this.http.post(`${TRACKING_BASE}/session/flush`, payload));
  }

  /** Log a component view (route/iframe navigation). */
  async logView(payload: LogViewPayload): Promise<void> {
    await firstValueFrom(this.http.post(`${TRACKING_BASE}/view`, payload));
  }

  /**
   * Fire-and-forget flush that survives page unload via `navigator.sendBeacon`,
   * falling back to a keepalive `fetch`. Always used with `isEnding=true`.
   * @returns true if the beacon was queued.
   */
  flushBeacon(payload: FlushPayload): boolean {
    const url = `${TRACKING_BASE}/session/flush`;
    const body = JSON.stringify(payload);
    if (typeof navigator !== 'undefined' && 'sendBeacon' in navigator) {
      const blob = new Blob([body], { type: 'application/json' });
      return navigator.sendBeacon(url, blob);
    }
    // Fallback for browsers without sendBeacon.
    void fetch(url, {
      method: 'POST',
      body,
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
    }).catch(() => undefined);
    return true;
  }
}
