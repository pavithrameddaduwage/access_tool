import { Module } from '@nestjs/common';
import { QaAgentController } from './qa-agent.controller';
import { QaAgentService } from './qa-agent.service';

/**
 * Self-contained QA agent (Rule 9): removing this module's import from
 * AppModule fully disables it with no side effects on other modules.
 *
 * Tools and checks are added to `providers` in later steps.
 */
@Module({
  controllers: [QaAgentController],
  providers: [QaAgentService],
})
export class QaAgentModule {}
