// src/powerbi-metrics/powerbi-metrics.controller.ts
import { Controller, Get, Query, DefaultValuePipe, BadRequestException, ParseIntPipe } from '@nestjs/common';
import { ParseISO8601DatePipe } from './parse-date.pipe';
import { PowerBIMetricsService } from './powerbi-metrics.service';

@Controller('powerbi-metrics')
export class PowerBIMetricsController {
  constructor(private readonly powerbiMetricsService: PowerBIMetricsService) {}

  @Get()
  async getMetrics(
    @Query('startDate', new DefaultValuePipe(new Date(Date.now() - 24 * 60 * 60 * 1000)), ParseISO8601DatePipe) startDate: Date,
    @Query('endDate', new DefaultValuePipe(new Date()), ParseISO8601DatePipe) endDate: Date,
  ) {
    // Convert to UTC and remove milliseconds
    const utcStart = new Date(startDate.toISOString().replace(/\.\d{3}Z$/, 'Z'));
    const utcEnd = new Date(endDate.toISOString().replace(/\.\d{3}Z$/, 'Z'));
    
    // Validate 24-hour window
    const hoursDiff = Math.abs(utcEnd.getTime() - utcStart.getTime()) / (1000 * 60 * 60);
    if (hoursDiff > 24) {
      throw new BadRequestException({
        message: 'Date range must be 24 hours or less',
        maxHours: 24,
        receivedHours: hoursDiff,
        example: 'Try ?startDate=2025-04-01T00:00:00Z&endDate=2025-04-01T23:59:59Z'
      });
    }
  
    return this.powerbiMetricsService.getPowerBIMetrics(utcStart, utcEnd);
  }
  @Get('workspace')
  async getWorkspaceMetrics(
    @Query('workspaceId') workspaceId: string,
    @Query('startDate', new DefaultValuePipe(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)), ParseISO8601DatePipe) startDate: Date,
    @Query('endDate', new DefaultValuePipe(new Date()), ParseISO8601DatePipe) endDate: Date,
  ) {
    return this.powerbiMetricsService.getWorkspaceMetrics(workspaceId, startDate, endDate);
  }

  @Get('report')
  async getReportMetrics(
    @Query('reportId') reportId: string,
    @Query('startDate', new DefaultValuePipe(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)), ParseISO8601DatePipe) startDate: Date,
    @Query('endDate', new DefaultValuePipe(new Date()), ParseISO8601DatePipe) endDate: Date,
  ) {
    return this.powerbiMetricsService.getReportMetrics(reportId, startDate, endDate);
  }

  @Get('collect-raw')
async collectRawData(
  @Query('startDate', ParseISO8601DatePipe) startDate: Date,
  @Query('endDate', ParseISO8601DatePipe) endDate: Date
) {
  const accessToken = await this.powerbiMetricsService.getAccessToken();
  await this.powerbiMetricsService.ensureSubscription(accessToken);
  
  // Get raw logs
  const contentUris = await this.powerbiMetricsService.getContentUris(accessToken, startDate, endDate);
  const allLogs = await Promise.all(
    contentUris.map(uri => this.powerbiMetricsService.getLogEntries(uri, accessToken))
  );
  
  // Filter and save
  const powerBILogs = allLogs.flat().filter(
    entry => entry.Workload === 'PowerBI' && entry.Operation === 'ViewReport'
  );
  
  // Save to database
  await this.powerbiMetricsService.saveRawLogs(powerBILogs);
  
  return {
    message: `Saved ${powerBILogs.length} raw logs`,
    logs: powerBILogs.slice(0, 5) // Return first 5 as sample
  };
}



@Get('views-by-date')
async getViewsByDate(
  @Query('startDate', ParseISO8601DatePipe) startDate: Date,
  @Query('endDate', ParseISO8601DatePipe) endDate: Date
) {
  return this.powerbiMetricsService.getViewCountsByDate(startDate, endDate);
}

@Get('top-reports')
async getTopReports(
  @Query('startDate', ParseISO8601DatePipe) startDate: Date,
  @Query('endDate', ParseISO8601DatePipe) endDate: Date,
  @Query('limit', new DefaultValuePipe(10), new ParseIntPipe()) limit: number
) {
  return this.powerbiMetricsService.getTopReports(startDate, endDate, limit);
}

@Get('top-users')
async getTopUsers(
  @Query('startDate', ParseISO8601DatePipe) startDate: Date,
  @Query('endDate', ParseISO8601DatePipe) endDate: Date,
  @Query('limit', new DefaultValuePipe(10), new ParseIntPipe()) limit: number
) {
  return this.powerbiMetricsService.getTopUsers(startDate, endDate, limit);
}

@Get('user-activity-trend')
async getUserActivityTrend(
  @Query('startDate', ParseISO8601DatePipe) startDate: Date,
  @Query('endDate', ParseISO8601DatePipe) endDate: Date
) {
  return this.powerbiMetricsService.getUserActivityTrend(startDate, endDate);
}

@Get('unique-user-count')
async getUniqueUserCount(
  @Query('startDate', ParseISO8601DatePipe) startDate: Date,
  @Query('endDate', ParseISO8601DatePipe) endDate: Date
) {
  return this.powerbiMetricsService.getUniqueUserCount(startDate, endDate);
}

@Get('unique-report-count')
async getUniqueReportCount(
  @Query('startDate', ParseISO8601DatePipe) startDate: Date,
  @Query('endDate', ParseISO8601DatePipe) endDate: Date
) {
  return this.powerbiMetricsService.getUniqueReportCount(startDate, endDate);
}

@Get('user-metrics')
async getUserMetrics(
  @Query('userId') userId: string,
  @Query('startDate', ParseISO8601DatePipe) startDate: Date,
  @Query('endDate', ParseISO8601DatePipe) endDate: Date
) {
  return this.powerbiMetricsService.getUserMetrics(userId, startDate, endDate);
}

@Get('workspace-views-distribution')
async getWorkspaceViewsDistribution(
  @Query('userId') userId: string,
  @Query('startDate', ParseISO8601DatePipe) startDate: Date,
  @Query('endDate', ParseISO8601DatePipe) endDate: Date
) {
  return this.powerbiMetricsService.getWorkspaceViewsDistribution(userId, startDate, endDate);
}
}