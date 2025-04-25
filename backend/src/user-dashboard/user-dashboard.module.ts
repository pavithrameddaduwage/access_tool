import { Module } from '@nestjs/common';
import { UserDashboardService } from './user-dashboard.service';
import { UserDashboardController } from './user-dashboard.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserDashboard } from './entities/user-dashboard.entity';
import { Dashboard } from 'src/dashboard/entities/dashboard.entity';
import { Workspace } from 'src/workspace/entities/workspace.entity';
import { DashboardWorkspace } from 'src/dashboard/entities/dashboard-workspace.entity';

@Module({
  controllers: [UserDashboardController],
  imports: [TypeOrmModule.forFeature([UserDashboard, Dashboard, Workspace, DashboardWorkspace])],
  providers: [UserDashboardService],
})
export class UserDashboardModule {}
