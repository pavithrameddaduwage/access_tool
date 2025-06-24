import { Body, Controller, Get, HttpException, HttpStatus, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { LoginTrackingService } from './login-tracking.service';
import { Request } from 'express'; // Make sure this import is correct
import { publicDecrypt } from 'crypto';
import { Public } from 'src/auth/decorators/public.decorator';
import { subDays } from 'date-fns';
import { ILike } from 'typeorm';

@Controller('analytics')
@UseGuards(AuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService, private loginTrackingService: LoginTrackingService ) {}


  @Get('login-events')
async getLoginEvents() {
  return this.analyticsService.getLoginEvents();
}


// @Get('user-stats/:email')
// async getUserStats(@Param('email') email: string) {
//   const [totalLogins, dailyLogins, loginsByHour, loginsByDay] = await Promise.all([
//     this.analyticsService.loginEventRepository.count({ where: { email } }),
//     this.analyticsService.getDailyLogins(30, undefined, email),
//     this.analyticsService.getLoginsByHour(undefined, email),
//     this.analyticsService.getLoginsByDayOfWeek(undefined, email)
//   ]);

//   const webtoolUsage = await this.analyticsService.loginEventRepository
//     .createQueryBuilder('login')
//     .select('login.webtool', 'webtool')
//     .addSelect('COUNT(*)', 'count')
//     .where('login.email = :email', { email })
//     .groupBy('login.webtool')
//     .orderBy('count', 'DESC')
//     .getRawOne();

//   // Find last login
//   const lastLogin = await this.analyticsService.loginEventRepository.findOne({
//     where: { email },
//     order: { loginTime: 'DESC' }
//   });

//   // Find peak hour
//   const peakHourData = await this.analyticsService.loginEventRepository
//     .createQueryBuilder('login')
//     .select('EXTRACT(HOUR FROM login.loginTime)', 'hour')
//     .addSelect('COUNT(*)', 'count')
//     .where('login.email = :email', { email })
//     .groupBy('EXTRACT(HOUR FROM login.loginTime)')
//     .orderBy('count', 'DESC')
//     .getRawOne();

//   return {
//     totalLogins,
//     mostUsedWebtool: webtoolUsage?.webtool || 'N/A',
//     lastLogin: lastLogin?.loginTime || null,
//     peakHour: peakHourData ? `${peakHourData.hour}:00` : 'N/A',
//     dailyLogins,
//     loginsByHour,
//     loginsByDay
//   };
// }



@Get('daily-logins')
async getDailyLoginStats(
  @Query('days') days: number = 30,
  @Query('webtool') webtool?: string,
  @Query('email') email?: string
) {
  return this.analyticsService.getDailyLogins(days, webtool, email);
}

@Get('logins-by-hour')
async getLoginsByHour(
  @Query('days') days: number = 30,  
  @Query('webtool') webtool?: string,
  @Query('email') email?: string
) {
  return this.analyticsService.getLoginsByHour(days, webtool, email);
}

@Get('logins-by-day')
async getLoginsByDayOfWeek(
  @Query('days') days: number = 30,  
  @Query('webtool') webtool?: string,
  @Query('email') email?: string
) {
  return this.analyticsService.getLoginsByDayOfWeek(days, webtool, email);
}
@Get('summary')
async getSummary(
  @Query('days') days: number = 30,
  @Query('webtool') webtool?: string,
  @Query('email') email?: string
) {
  return this.analyticsService.getSummary(days, webtool, email);
}

@Get('department-logins')
async getDepartmentLoginStats(
  @Query('days') days: number = 30,
  @Query('webtool') webtool?: string,
  @Query('email') email?: string
) {
  return this.analyticsService.getDepartmentLoginStats(days, webtool, email);
}

@Get('department-hourly-logins')
async getDepartmentHourlyLogins(
  @Query('days') days: number = 30,
  @Query('webtool') webtool?: string,
  @Query('email') email?: string
) {
  return this.analyticsService.getDepartmentHourlyLogins(days, webtool, email);
}

@Get('department-daily-logins')
async getDepartmentDailyLogins(
  @Query('days') days: number = 30,
  @Query('webtool') webtool?: string,
  @Query('email') email?: string
) {
  return this.analyticsService.getDepartmentDailyLogins(days, webtool, email);
}

@Post('record-login')
@Public()
async recordLogin(
  @Body() data: {
    email: string;
    webtool: string;
    department?: string;
    location?: string;
  },
  @Req() req: Request
) {
  return this.loginTrackingService.recordLogin(
    data.email,
    data.webtool,
    req,
    data.department,
    data.location
  );
}


@Get('user-stats/:email')
async getUserStats(
  @Param('email') email: string,
  @Query('webtool') webtool?: string,
  @Query('days') days: number = 30
) {
  return this.analyticsService.getUserStats(email, webtool, days);
}

@Get('user-webtool-stats/:email')
async getUserWebtoolStats(
  @Param('email') email: string,
  @Query('days') days: number = 30
) {
  return this.analyticsService.getUserWebtoolStats(email, days);
}

@Get('top-active-users')
async getTopActiveUsers(
  @Query('days') days: number = 30,
  @Query('webtool') webtool?: string
) {
  return this.analyticsService.getTopActiveUsers(days, webtool);
}

@Get('top-used-webtools')
async getTopUsedWebtools(
  @Query('days') days: number = 30,
  @Query('email') email?: string
) {
  return this.analyticsService.getTopUsedWebtools(days, email);
}
}