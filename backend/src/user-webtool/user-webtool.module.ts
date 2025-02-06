import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserWebtoolService } from './user-webtool.service';
import { UserWebtoolController } from './user-webtool.controller';
import { UserWebtool } from './entities/user-webtool.entity';
import { Webtool } from 'src/webtool/entities/webtool.entity';
import { Role } from 'src/roles/entities/role.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserWebtool, Webtool, Role])],
  controllers: [UserWebtoolController],
  providers: [UserWebtoolService],
  exports: [UserWebtoolService]
})
export class UserWebtoolModule {}