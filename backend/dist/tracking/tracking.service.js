"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var TrackingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrackingService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const tracker_session_entity_1 = require("./entities/tracker-session.entity");
const tracker_usage_event_entity_1 = require("./entities/tracker-usage-event.entity");
const component_view_count_entity_1 = require("./entities/component-view-count.entity");
let TrackingService = TrackingService_1 = class TrackingService {
    constructor(sessionRepo, eventRepo, viewCountRepo, dataSource) {
        this.sessionRepo = sessionRepo;
        this.eventRepo = eventRepo;
        this.viewCountRepo = viewCountRepo;
        this.dataSource = dataSource;
        this.logger = new common_1.Logger(TrackingService_1.name);
    }
    async startSession(dto) {
        const session = this.sessionRepo.create({
            id: dto.sessionId,
            userId: dto.userId,
            dashboardId: dto.dashboardId,
            tabName: dto.tabName ?? null,
            department: dto.department ?? null,
            startedAt: new Date(dto.startedAt),
            isActive: true,
        });
        await this.sessionRepo
            .createQueryBuilder()
            .insert()
            .into(tracker_session_entity_1.TrackerSession)
            .values(session)
            .orIgnore()
            .execute();
        return this.sessionRepo.findOneByOrFail({ id: dto.sessionId });
    }
    async flushSession(dto) {
        return this.dataSource.transaction(async (manager) => {
            const flushAt = new Date(dto.timestamp);
            await manager
                .createQueryBuilder()
                .insert()
                .into(tracker_session_entity_1.TrackerSession)
                .values({
                id: dto.sessionId,
                userId: dto.userId,
                dashboardId: dto.dashboardId,
                tabName: dto.tabName ?? null,
                department: dto.department ?? null,
                engagedSeconds: dto.engagedSeconds,
                clickCount: dto.clickCount,
                scrollCount: dto.scrollCount,
                copyCount: dto.copyCount,
                keydownCount: dto.keydownCount,
                selectCount: dto.selectCount,
                isActive: !dto.isEnding,
                idleExpired: dto.idleExpired ?? false,
                startedAt: flushAt,
                lastFlushAt: flushAt,
                endedAt: dto.isEnding ? flushAt : null,
            })
                .orUpdate([
                'tab_name',
                'department',
                'engaged_seconds',
                'click_count',
                'scroll_count',
                'copy_count',
                'keydown_count',
                'select_count',
                'is_active',
                'idle_expired',
                'last_flush_at',
                'ended_at',
            ], ['id'])
                .execute();
            if (dto.events?.length) {
                const rows = dto.events.map((e) => manager.create(tracker_usage_event_entity_1.TrackerUsageEvent, {
                    sessionId: dto.sessionId,
                    userId: dto.userId,
                    dashboardId: dto.dashboardId,
                    tabName: dto.tabName ?? null,
                    eventType: e.eventType,
                    eventData: e.eventData ?? null,
                    createdAt: e.timestamp ? new Date(e.timestamp) : undefined,
                }));
                await manager.insert(tracker_usage_event_entity_1.TrackerUsageEvent, rows);
            }
            return manager.findOneByOrFail(tracker_session_entity_1.TrackerSession, { id: dto.sessionId });
        });
    }
    async endSession(dto) {
        const endedAt = dto.endedAt ? new Date(dto.endedAt) : new Date();
        await this.sessionRepo.update({ id: dto.sessionId }, { isActive: false, endedAt, lastFlushAt: endedAt });
        return this.sessionRepo.findOneByOrFail({ id: dto.sessionId });
    }
    async logView(dto) {
        const viewedAt = new Date(dto.timestamp);
        await this.viewCountRepo.query(`INSERT INTO component_view_counts
         (user_id, component_type, component_id, component_name, workspace_id,
          view_count, last_viewed_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, 1, $6, NOW(), NOW())
       ON CONFLICT (user_id, component_type, component_id)
       DO UPDATE SET
         view_count     = component_view_counts.view_count + 1,
         component_name = COALESCE(EXCLUDED.component_name, component_view_counts.component_name),
         workspace_id   = COALESCE(EXCLUDED.workspace_id, component_view_counts.workspace_id),
         last_viewed_at = EXCLUDED.last_viewed_at,
         updated_at     = NOW()`, [
            dto.userId,
            dto.componentType,
            dto.componentId,
            dto.componentName ?? null,
            dto.workspaceId ?? null,
            viewedAt,
        ]);
        return this.viewCountRepo.findOneByOrFail({
            userId: dto.userId,
            componentType: dto.componentType,
            componentId: dto.componentId,
        });
    }
};
exports.TrackingService = TrackingService;
exports.TrackingService = TrackingService = TrackingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(tracker_session_entity_1.TrackerSession)),
    __param(1, (0, typeorm_1.InjectRepository)(tracker_usage_event_entity_1.TrackerUsageEvent)),
    __param(2, (0, typeorm_1.InjectRepository)(component_view_count_entity_1.ComponentViewCount)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource])
], TrackingService);
//# sourceMappingURL=tracking.service.js.map