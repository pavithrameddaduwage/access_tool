import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DepartmentModule } from './department/department.module';
import { RolesModule } from './roles/roles.module';
import { TypeModule } from './type/type.module';
import { ValuetypeModule } from './valuetype/valuetype.module';
import { WebtoolModule } from './webtool/webtool.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { WorkspaceModule } from './workspace/workspace.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Type } from './type/entities/type.entity';
import { Dashboard } from './dashboard/entities/dashboard.entity';
import { DashboardType } from './dashboard/entities/dashboard-type.entity';
import { DashboardValuetype } from './dashboard/entities/dashboard-valuetype.entity';
import { Valuetype } from './valuetype/entities/valuetype.entity';
import { UserDashboardModule } from './user-dashboard/user-dashboard.module';
import { UserWebtoolModule } from './user-webtool/user-webtool.module';
import { GroupsModule } from './group/group.module';
import { WebtoolUserModule } from './webtool-user/webtool-user.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AuthGuard } from './auth/guards/auth.guard';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { HttpExceptionFilter } from './http-exception.filter';


@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost', 
      port: 5432,
      username: 'postgres', 
       password: '12345', 
      //password:"M!SAppsTest",
 
      database: 'user-access',
      entities: [Type,  Dashboard,
        DashboardType,
        DashboardValuetype,
       
        Valuetype], 
      autoLoadEntities: true, 
      synchronize: true, 
      logging: true, 
    }),
    DepartmentModule,
    RolesModule,
    TypeModule,
    ValuetypeModule,
    WebtoolModule,
    DashboardModule,
    WorkspaceModule,
    UserDashboardModule,
    UserWebtoolModule,
    GroupsModule,
    WebtoolUserModule,
    AuthModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    }
  ],
})
export class AppModule {}
