import { Module } from '@nestjs/common';
import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from './entities/role.entity';
import { WebtoolModule } from 'src/webtool/webtool.module';

@Module({
  controllers: [RolesController],
      imports: [TypeOrmModule.forFeature([Role]), WebtoolModule],
  
  providers: [RolesService],
})
export class RolesModule {}
