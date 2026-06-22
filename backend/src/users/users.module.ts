import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { RoleMaster } from './entities/role_master.entity';
import { UserRoles } from './entities/user_roles.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, RoleMaster, UserRoles])
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService]
})
export class UsersModule {}