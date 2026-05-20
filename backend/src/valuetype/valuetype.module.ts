import { Module } from '@nestjs/common';
import { ValuetypeService } from './valuetype.service';
import { ValuetypeController } from './valuetype.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Valuetype } from './entities/valuetype.entity';

@Module({
  controllers: [ValuetypeController],
      imports: [TypeOrmModule.forFeature([Valuetype])],
  providers: [ValuetypeService],
})
export class ValuetypeModule {}
