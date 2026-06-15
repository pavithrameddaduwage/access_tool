import { Injectable, Logger } from '@nestjs/common';
import { execSync } from 'child_process';
import { QaRunOptionsDto } from './dto/qa-run-options.dto';
import { CheckResult, QaReport } from './qa-agent.types';

/**
 * Orchestrates the QA checks and assembles the {@link QaReport}.
 *
 * Self-contained (Rule 9): removing QaAgentModule has no effect on other modules.
 * Step 1 is a scaffold — individual checks/tools are wired in later steps. Each
 * check will be run defensively so a thrown check becomes a FAIL, never aborting
 * the run (Rule 10).
 */
@Injectable()
export class QaAgentService {
  private readonly logger = new Logger(QaAgentService.name);

  /**
   * Run the requested checks (or all) and return a structured report.
   * @param options Optional check filter / verbosity / target env.
   */
  async runAllChecks(options: QaRunOptionsDto): Promise<QaReport> {
    const start = Date.now();
    this.logger.log(`QA run requested (targetEnv=${options.targetEnv ?? 'local'})`);

    // Checks are registered in subsequent steps.
    const checkResults: CheckResult[] = [];

    const passedCount = checkResults.filter((c) => c.passed).length;
    const failedCount = checkResults.length - passedCount;
    const issues = checkResults.flatMap((c) => c.issues);

    return {
      runDate: new Date().toISOString(),
      branch: this.getBranch(),
      durationMs: Date.now() - start,
      passedCount,
      failedCount,
      totalChecks: checkResults.length,
      issues,
      markdown: '# PowerBI QA Agent Report\n\n_Scaffold ready — no checks wired yet._\n',
      checkResults: options.verbose
        ? checkResults
        : checkResults.map(({ raw, ...rest }) => rest),
    };
  }

  /** Current git branch (best-effort; falls back to "unknown"). */
  private getBranch(): string {
    try {
      return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
    } catch {
      return 'unknown';
    }
  }
}
