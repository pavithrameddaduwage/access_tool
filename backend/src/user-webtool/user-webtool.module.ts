import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserWebtoolService } from './user-webtool.service';
import { UserWebtoolController } from './user-webtool.controller';
import { UserWebtool } from './entities/user-webtool.entity';
import { Webtool } from 'src/webtool/entities/webtool.entity';
import { Role } from 'src/roles/entities/role.entity';
import { ExternalWebtoolGuard } from 'src/auth/guards/external-webtool.guard';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { AuthModule } from 'src/auth/auth.module';
import { jwtConstants } from 'src/auth/constants';


@Module({
  imports: [
    TypeOrmModule.forFeature([UserWebtool, Webtool, Role]),
    AuthModule,  // Add this
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [UserWebtoolController],
  providers: [UserWebtoolService, ExternalWebtoolGuard],
  exports: [UserWebtoolService]
})
export class UserWebtoolModule {}