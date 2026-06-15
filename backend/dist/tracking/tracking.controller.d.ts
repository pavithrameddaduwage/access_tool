import { TrackingService } from './tracking.service';
import { StartSessionDto } from './dto/start-session.dto';
import { FlushSessionDto } from './dto/flush-session.dto';
import { EndSessionDto } from './dto/end-session.dto';
import { LogViewDto } from './dto/log-view.dto';
import { TrackerSession } from './entities/tracker-session.entity';
import { ComponentViewCount } from './entities/component-view-count.entity';
export declare class TrackingController {
    private readonly trackingService;
    constructor(trackingService: TrackingService);
    startSession(dto: StartSessionDto): Promise<TrackerSession>;
    flushSession(dto: FlushSessionDto): Promise<TrackerSession>;
    endSession(dto: EndSessionDto): Promise<TrackerSession>;
    logView(dto: LogViewDto): Promise<ComponentViewCount>;
}
