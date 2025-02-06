import { Module } from '@nestjs/common';
import { UserDashboardService } from './user-dashboard.service';
import { UserDashboardController } from './user-dashboard.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserDashboard } from './entities/user-dashboard.entity';
import { Dashboard } from 'src/dashboard/entities/dashboard.entity';

@Module({
  controllers: [UserDashboardController],
  imports: [TypeOrmModule.forFeature([UserDashboard, Dashboard])],
  providers: [UserDashboardService],
})
export class UserDashboardModule {}
