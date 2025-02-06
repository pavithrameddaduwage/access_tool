import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebtoolUserService } from './webtool-user.service';
import { WebtoolUserController } from './webtool-user.controller';
import { UserWebtool } from '../user-webtool/entities/user-webtool.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserWebtool])],
  controllers: [WebtoolUserController],
  providers: [WebtoolUserService],
  exports: [WebtoolUserService]
})
export class WebtoolUserModule {}