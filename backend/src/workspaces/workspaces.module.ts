import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PbiWorkspace } from './entities/pbi-workspace.entity';
import { PbiReport } from './entities/pbi-report.entity';
import { PbiDashboard } from './entities/pbi-dashboard.entity';
import { PbiActivityEvent } from '../activity/entities/pbi-activity-event.entity';
import { WorkspacesService } from './workspaces.service';
import { WorkspacesController } from './workspaces.controller';
import { PowerBIModule } from '../powerbi/powerbi.module';
import { SyncLogModule } from '../sync-log/sync-log.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PbiWorkspace, PbiReport, PbiDashboard, PbiActivityEvent]),
    PowerBIModule,
    SyncLogModule,
  ],
  controllers: [WorkspacesController],
  providers: [WorkspacesService],
  exports: [WorkspacesService],
})
export class WorkspacesModule {}
