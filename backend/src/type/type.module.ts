import { Module } from '@nestjs/common';
import { TypeService } from './type.service';
import { TypeController } from './type.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Type } from './entities/type.entity';

@Module({
  controllers: [TypeController],
    imports: [TypeOrmModule.forFeature([Type])],
  providers: [TypeService],
})
export class TypeModule {}
