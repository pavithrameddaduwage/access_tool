import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt'; // Remove JwtService from import
import { jwtConstants } from './constants';
import { UsersModule } from 'src/users/users.module';
import { RoleMaster } from 'src/users/entities/role_master.entity';
import { UserRoles } from 'src/users/entities/user_roles.entity';
import { User } from 'src/users/entities/user.entity';

@Module({
  imports: [
    UsersModule,
    TypeOrmModule.forFeature([User, RoleMaster, UserRoles]), 
    JwtModule.register({
      global: true,
      secret: jwtConstants.secret,  // Use the same secret
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService]
})
export class AuthModule { }