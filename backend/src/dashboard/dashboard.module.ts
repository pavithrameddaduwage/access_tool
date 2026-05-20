import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Dashboard } from './entities/dashboard.entity';
import { DashboardType } from './entities/dashboard-type.entity';
import { DashboardValuetype } from './entities/dashboard-valuetype.entity';
import { Type } from 'src/type/entities/type.entity';
import { Valuetype } from 'src/valuetype/entities/valuetype.entity';
import { Workspace } from 'src/workspace/entities/workspace.entity';
import { DashboardWorkspace } from './entities/dashboard-workspace.entity';
import { UserDashboard } from 'src/user-dashboard/entities/user-dashboard.entity';

@Module({
  controllers: [DashboardController],
  imports: [
    TypeOrmModule.forFeature([
      Dashboard,
      DashboardType,
      DashboardValuetype,
      Type,
      Valuetype,
      Workspace,
      DashboardWorkspace,
      UserDashboard
    ]),
  ],
  providers: [DashboardService],
})
export class DashboardModule {}
