import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { QaAgentService } from './qa-agent.service';
import { QaRunOptionsDto } from './dto/qa-run-options.dto';
import { QaReport } from './qa-agent.types';
import { Public } from '../../auth/decorators/public.decorator';

/**
 * QA agent entry point.
 *
 * Marked `@Public()` so the self-test can run without a JWT (the global
 * AuthGuard would otherwise 401 it). In a deployed environment, restrict this
 * route — it writes namespaced test data to the DB.
 */
@Controller('qa')
export class QaAgentController {
  constructor(private readonly qaAgentService: QaAgentService) {}

  /** Run all checks (or a subset) and return the structured report + markdown. */
  @Public()
  @Post('run')
  @HttpCode(HttpStatus.OK)
  async runQa(@Body() options: QaRunOptionsDto): Promise<QaReport> {
    return this.qaAgentService.runAllChecks(options);
  }
}
