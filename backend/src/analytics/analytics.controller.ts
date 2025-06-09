import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('analytics')
@UseGuards(AuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

 
  @Get('daily-logins')
  async getDailyLoginStats(
    @Query('days') days: number = 30,
    @Query('webtool') webtool?: string
  ) {
    return this.analyticsService.getDailyLogins(days, webtool);
  }

  @Get('logins-by-hour')
  async getLoginsByHour(@Query('webtool') webtool?: string) {
    return this.analyticsService.getLoginsByHour(webtool);
  }

  @Get('logins-by-day')
  async getLoginsByDayOfWeek(@Query('webtool') webtool?: string) {
    return this.analyticsService.getLoginsByDayOfWeek(webtool);
  }

  @Get('summary')
  async getSummary(
    @Query('days') days: number = 30,
    @Query('webtool') webtool?: string
  ) {
    return this.analyticsService.getSummary(days, webtool);
  }

}