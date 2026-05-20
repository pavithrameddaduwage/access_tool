import { Module, Global } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt'; // Remove JwtService from import
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from 'src/users/users.module';
import { RoleMaster } from 'src/users/entities/role_master.entity';
import { UserRoles } from 'src/users/entities/user_roles.entity';
import { User } from 'src/users/entities/user.entity';
import { LoginTrackingService } from 'src/analytics/login-tracking.service';
import { AnalyticsModule } from 'src/analytics/analytics.module';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './guards/auth.guard';

@Global()
@Module({
  imports: [
    UsersModule, AnalyticsModule, ConfigModule,
    TypeOrmModule.forFeature([User, RoleMaster, UserRoles]), 
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        global: true,
        secret: configService.get<string>('JWT_SECRET') || 'your-strong-secret-key-here-min-32-chars',  
        signOptions: { expiresIn: '24h' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
  exports: [AuthService, JwtModule]
})
export class AuthModule { }