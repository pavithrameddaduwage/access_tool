/**
 * Shared types for the self-contained QA agent module.
 *
 * The QA agent runs against the app's existing database using `qa-` namespaced
 * test data and per-check scoped cleanup (never TRUNCATE), and never calls the
 * real Microsoft API.
 */

export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

/** A single problem surfaced by a failing (or degraded) check. */
export interface QaIssue {
  check: string;
  severity: Severity;
  description: string;
  expected: string;
  actual: string;
  suggestion: string;
}

/** Outcome of one check. Always produced — a thrown check is reported as FAIL. */
export interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
  durationMs: number;
  issues: QaIssue[];
  /** Raw tool outputs, included only when `verbose` is requested. */
  raw?: unknown;
}

/** Full structured report returned by `POST /qa/run`. */
export interface QaReport {
  runDate: string;
  branch: string;
  durationMs: number;
  passedCount: number;
  failedCount: number;
  totalChecks: number;
  issues: QaIssue[];
  markdown: string;
  checkResults: CheckResult[];
}
