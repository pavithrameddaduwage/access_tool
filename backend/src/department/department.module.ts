import { Module } from '@nestjs/common';
import { DepartmentService } from './department.service';
import { DepartmentController } from './department.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Department } from './entities/department.entity';

@Module({
  controllers: [DepartmentController],
  imports: [TypeOrmModule.forFeature([Department])],
  providers: [DepartmentService],
})
export class DepartmentModule {}
