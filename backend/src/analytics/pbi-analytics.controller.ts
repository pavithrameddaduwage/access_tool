import { Controller, Get, Query, Param } from '@nestjs/common';
import { PbiAnalyticsService } from './pbi-analytics.service';
import { PbiActivityEvent } from '../activity/entities/pbi-activity-event.entity';

@Controller('api/analytics')
export class PbiAnalyticsController {
  constructor(private readonly analyticsService: PbiAnalyticsService) {}

  @Get('overview')
  async getOverview(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ): Promise<any> {
    return this.analyticsService.getOverview(from, to);
  }

  @Get('views')
  async getViews(
    @Query('workspaceId') workspaceId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ): Promise<any[]> {
    return this.analyticsService.getViews(workspaceId, from, to);
  }

  @Get('top-reports')
  async getTopReports(
    @Query('workspaceId') workspaceId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit?: string,
  ): Promise<any[]> {
    const lim = limit ? parseInt(limit, 10) : 10;
    return this.analyticsService.getTopReports(workspaceId, from, to, lim);
  }

  @Get('top-users')
  async getTopUsers(
    @Query('workspaceId') workspaceId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit?: string,
  ): Promise<any[]> {
    const lim = limit ? parseInt(limit, 10) : 10;
    return this.analyticsService.getTopUsers(workspaceId, from, to, lim);
  }

  @Get('duration')
  async getDuration(
    @Query('userId') userId?: string,
    @Query('reportId') reportId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ): Promise<any[]> {
    return this.analyticsService.getDuration(userId, reportId, from, to);
  }

  @Get('user-timeline')
  async getUserTimeline(
    @Query('userId') userId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ): Promise<PbiActivityEvent[]> {
    return this.analyticsService.getUserTimeline(userId, from, to);
  }

  @Get('report-detail')
  async getReportDetail(
    @Query('reportId') reportId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ): Promise<any[]> {
    return this.analyticsService.getReportDetail(reportId, from, to);
  }

  @Get('workspace-summary')
  async getWorkspaceSummary(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ): Promise<any[]> {
    return this.analyticsService.getWorkspaceSummary(from, to);
  }
}
