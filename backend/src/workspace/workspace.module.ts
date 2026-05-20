import { Module } from '@nestjs/common';
import { WorkspaceService } from './workspace.service';
import { WorkspaceController } from './workspace.controller';
import { Workspace } from './entities/workspace.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  controllers: [WorkspaceController],
  imports: [TypeOrmModule.forFeature([Workspace])],
  providers: [WorkspaceService],
})
export class WorkspaceModule {}
