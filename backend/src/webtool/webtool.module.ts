import { Module } from '@nestjs/common';
import { WebtoolService } from './webtool.service';
import { WebtoolController } from './webtool.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Webtool } from './entities/webtool.entity';

@Module({
  controllers: [WebtoolController],
      imports: [TypeOrmModule.forFeature([Webtool])],
  providers: [WebtoolService],
  exports: [TypeOrmModule]
})
export class WebtoolModule {}
