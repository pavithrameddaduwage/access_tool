import { QaAgentService } from './qa-agent.service';
import { QaRunOptionsDto } from './dto/qa-run-options.dto';
import { QaReport } from './qa-agent.types';
export declare class QaAgentController {
    private readonly qaAgentService;
    constructor(qaAgentService: QaAgentService);
    runQa(options: QaRunOptionsDto): Promise<QaReport>;
}
