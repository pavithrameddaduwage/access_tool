import { Module } from '@nestjs/common';
import { UserDashboardService } from './user-dashboard.service';
import { UserDashboardController } from './user-dashboard.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserDashboard } from './entities/user-dashboard.entity';
import { Dashboard } from 'src/dashboard/entities/dashboard.entity';
import { Workspace } from 'src/workspace/entities/workspace.entity';
import { DashboardWorkspace } from 'src/dashboard/entities/dashboard-workspace.entity';
import { SyncDepartmentsTask } from './tasks/sync-departments.task';
import { SyncUserDepartmentsService } from './sync-user-departments.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  controllers: [UserDashboardController],
  imports: [TypeOrmModule.forFeature([UserDashboard, Dashboard, Workspace, DashboardWorkspace]), HttpModule],
  providers: [UserDashboardService, SyncDepartmentsTask, SyncUserDepartmentsService],
  exports: [UserDashboardService, UserDashboardModule],
})
export class UserDashboardModule {}
