import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PbiSyncLog } from './entities/pbi-sync-log.entity';
import { SyncLogService } from './sync-log.service';

@Module({
  imports: [TypeOrmModule.forFeature([PbiSyncLog])],
  providers: [SyncLogService],
  exports: [SyncLogService],
})
export class SyncLogModule {}
