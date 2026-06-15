import { DataSource, Repository } from 'typeorm';
import { TrackerSession } from './entities/tracker-session.entity';
import { TrackerUsageEvent } from './entities/tracker-usage-event.entity';
import { ComponentViewCount } from './entities/component-view-count.entity';
import { StartSessionDto } from './dto/start-session.dto';
import { FlushSessionDto } from './dto/flush-session.dto';
import { EndSessionDto } from './dto/end-session.dto';
import { LogViewDto } from './dto/log-view.dto';
export declare class TrackingService {
    private readonly sessionRepo;
    private readonly eventRepo;
    private readonly viewCountRepo;
    private readonly dataSource;
    private readonly logger;
    constructor(sessionRepo: Repository<TrackerSession>, eventRepo: Repository<TrackerUsageEvent>, viewCountRepo: Repository<ComponentViewCount>, dataSource: DataSource);
    startSession(dto: StartSessionDto): Promise<TrackerSession>;
    flushSession(dto: FlushSessionDto): Promise<TrackerSession>;
    endSession(dto: EndSessionDto): Promise<TrackerSession>;
    logView(dto: LogViewDto): Promise<ComponentViewCount>;
}
