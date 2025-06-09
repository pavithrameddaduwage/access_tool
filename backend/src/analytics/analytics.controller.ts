import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('analytics')
@UseGuards(AuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('summary')
  async getSummary(
    @Query('days') days: number = 30,
    @Query('webtool') webtool?: string
  ) {
    return this.analyticsService.getSummary(days, webtool);
  }
  
  @Get('daily-logins')
  async getDailyLoginStats(
    @Query('days') days: number = 30,
    @Query('webtool') webtool?: string
  ) {
    return this.analyticsService.getDailyLogins(days, webtool);
  }
//   @Get('summary')
// async getSummary(@Query('days') days: number = 30) {
//   return this.analyticsService.getSummary(days);
// }

  @Get('user-stats')
  async getUserStats(@Query('email') email: string) {
    return this.analyticsService.getUserLoginStats(email);
  }

  // @Get('daily-logins')
  // async getDailyLoginStats(@Query('days') days: number = 30) {
  //   return this.analyticsService.getDailyLogins(days);
  // }
//   @Get('logins-by-hour')
// async getLoginsByHour() {
//   return this.analyticsService.getLoginsByHour();
// }

// @Get('logins-by-day')
// async getLoginsByDayOfWeek() {
//   return this.analyticsService.getLoginsByDayOfWeek();
// }

@Get('logins-by-hour')
async getLoginsByHour(@Query('webtool') webtool?: string) {
  return this.analyticsService.getLoginsByHour('America/New_York', webtool);
}

@Get('logins-by-day')
async getLoginsByDayOfWeek(@Query('webtool') webtool?: string) {
  return this.analyticsService.getLoginsByDayOfWeek('America/New_York', webtool);
}
}