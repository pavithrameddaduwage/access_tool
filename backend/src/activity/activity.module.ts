import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { PbiActivityEvent } from './entities/pbi-activity-event.entity';
import { PbiUser } from '../users/entities/pbi-user.entity';
import { ActivityService } from './activity.service';
import { ActivityController } from './activity.controller';
import { SyncLogModule } from '../sync-log/sync-log.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PbiActivityEvent, PbiUser]),
    ConfigModule,
    SyncLogModule,
  ],
  controllers: [ActivityController],
  providers: [ActivityService],
  exports: [ActivityService, TypeOrmModule],
})
export class ActivityModule {}
