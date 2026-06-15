import { QaRunOptionsDto } from './dto/qa-run-options.dto';
import { QaReport } from './qa-agent.types';
export declare class QaAgentService {
    private readonly logger;
    runAllChecks(options: QaRunOptionsDto): Promise<QaReport>;
    private getBranch;
}
