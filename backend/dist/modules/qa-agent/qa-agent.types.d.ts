export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export interface QaIssue {
    check: string;
    severity: Severity;
    description: string;
    expected: string;
    actual: string;
    suggestion: string;
}
export interface CheckResult {
    name: string;
    passed: boolean;
    detail: string;
    durationMs: number;
    issues: QaIssue[];
    raw?: unknown;
}
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
