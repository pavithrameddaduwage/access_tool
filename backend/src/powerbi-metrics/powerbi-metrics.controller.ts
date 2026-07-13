import { Controller, Get, Query, DefaultValuePipe, BadRequestException, ParseIntPipe, Post, Body, Patch, Delete, Param } from '@nestjs/common';
import { ParseISO8601DatePipe } from './parse-date.pipe';
import { PowerBIMetricsService } from './powerbi-metrics.service';
import { Repository } from 'typeorm';
import { UserDashboard } from 'src/user-dashboard/entities/user-dashboard.entity';

@Controller('powerbi-metrics')
export class PowerBIMetricsController {
  constructor(private readonly powerbiMetricsService: PowerBIMetricsService
  ) {}

  @Get()
  async getMetrics(
    @Query('startDate', new DefaultValuePipe(new Date(Date.now() - 24 * 60 * 60 * 1000)), ParseISO8601DatePipe) startDate: Date,
    @Query('endDate', new DefaultValuePipe(new Date()), ParseISO8601DatePipe) endDate: Date,
  ) {
 
    const utcStart = new Date(startDate.toISOString().replace(/\.\d{3}Z$/, 'Z'));
    const utcEnd = new Date(endDate.toISOString().replace(/\.\d{3}Z$/, 'Z'));
    
    
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
  const limitTime = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const limitDate = new Date(limitTime);

  let adjustedStart = new Date(startDate);
  const adjustedEnd = new Date(endDate);

  if (adjustedEnd.getTime() < limitTime) {
    return {
      message: `Skipped sync: Requested end date (${endDate.toISOString()}) is older than the 7-day Office 365 API boundary (${limitDate.toISOString()}). No data could be fetched.`,
      logs: []
    };
  }

  let wasClamped = false;
  if (adjustedStart.getTime() < limitTime) {
    adjustedStart = limitDate;
    wasClamped = true;
  }

  const accessToken = await this.powerbiMetricsService.getAccessToken();
  await this.powerbiMetricsService.ensureSubscription(accessToken);
  
  const contentUris = await this.powerbiMetricsService.getContentUris(accessToken, adjustedStart, adjustedEnd);
  const allLogs = await Promise.all(
    contentUris.map(async (uri) => {
      try {
        return await this.powerbiMetricsService.getLogEntries(uri, accessToken);
      } catch (err) {
        console.error(`Failed to fetch logs for content URI: ${uri}`, err);
        return [];
      }
    })
  );
  
  const powerBILogs = allLogs.flat().filter(
    entry => entry && entry.Workload === 'PowerBI' && entry.Operation === 'ViewReport'
  );
  
  await this.powerbiMetricsService.saveRawLogs(powerBILogs);
  
  return {
    message: `Saved ${powerBILogs.length} raw logs${wasClamped ? ' (Start date clamped to 7-day limit: ' + adjustedStart.toISOString() + ')' : ''}`,
    logs: powerBILogs.slice(0, 5) 
  };
}



@Get('unique-user-count')
async getUniqueUserCount(
  @Query('startDate', ParseISO8601DatePipe) startDate: Date,
  @Query('endDate', ParseISO8601DatePipe) endDate: Date,
  @Query('workspaceId') workspaceId?: string,
  @Query('reportId') reportId?: string
) {
  return this.powerbiMetricsService.getUniqueUserCount(startDate, endDate, workspaceId, reportId);
}

@Get('unique-report-count')
async getUniqueReportCount(
  @Query('startDate', ParseISO8601DatePipe) startDate: Date,
  @Query('endDate', ParseISO8601DatePipe) endDate: Date,
  @Query('workspaceId') workspaceId?: string
) {
  return this.powerbiMetricsService.getUniqueReportCount(startDate, endDate, workspaceId);
}

@Get('user-activity-trend')
async getUserActivityTrend(
  @Query('startDate', ParseISO8601DatePipe) startDate: Date,
  @Query('endDate', ParseISO8601DatePipe) endDate: Date,
  @Query('workspaceId') workspaceId?: string,
  @Query('reportId') reportId?: string
) {
  return this.powerbiMetricsService.getUserActivityTrend(startDate, endDate, workspaceId, reportId);
}

@Get('user-metrics')
async getUserMetrics(
  @Query('userId') userId: string,
  @Query('startDate', ParseISO8601DatePipe) startDate: Date,
  @Query('endDate', ParseISO8601DatePipe) endDate: Date,
  @Query('workspaceId') workspaceId?: string,
  @Query('reportId') reportId?: string
) {
  return this.powerbiMetricsService.getUserMetrics(userId, startDate, endDate, workspaceId, reportId);
}

@Get('get-log')
async getLog(){
  return this.powerbiMetricsService.getAllLogs();
}

@Get('logs')
async getLogs(
  @Query('startDate', new DefaultValuePipe(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)), ParseISO8601DatePipe) startDate: Date,
  @Query('endDate', new DefaultValuePipe(new Date()), ParseISO8601DatePipe) endDate: Date,
  @Query('workspaceId') workspaceId?: string,
  @Query('reportId') reportId?: string
) {
  return this.powerbiMetricsService.getDatabaseLogEntries(startDate, endDate, workspaceId, reportId);
}

@Get('user-consumption-methods')
async getUserConsumptionMethods(
  @Query('userId') userId: string,
  @Query('startDate', ParseISO8601DatePipe) startDate: Date,
  @Query('endDate', ParseISO8601DatePipe) endDate: Date
) {
  return this.powerbiMetricsService.getUserConsumptionMethods(userId, startDate, endDate);
}

@Get('workspace-views-distribution')
async getWorkspaceViewsDistribution(
  @Query('userId') userId: string,
  @Query('startDate', ParseISO8601DatePipe) startDate: Date,
  @Query('endDate', ParseISO8601DatePipe) endDate: Date,
  @Query('reportId') reportId?: string
) {
  return this.powerbiMetricsService.getWorkspaceViewsDistribution(userId, startDate, endDate, reportId);
}

@Get('distinct-workspaces')
async getDistinctWorkspaces(
  @Query('startDate', ParseISO8601DatePipe) startDate: Date,
  @Query('endDate', ParseISO8601DatePipe) endDate: Date,
  @Query('reportId') reportId?: string
) {
  return this.powerbiMetricsService.getDistinctWorkspaces(startDate, endDate, reportId);
}

@Get('distinct-reports')
async getDistinctReports(
  @Query('startDate', ParseISO8601DatePipe) startDate: Date,
  @Query('endDate', ParseISO8601DatePipe) endDate: Date,
  @Query('workspaceId') workspaceId?: string
) {
  return this.powerbiMetricsService.getDistinctReports(startDate, endDate, workspaceId);
}


@Get('views-by-date')
async getViewsByDate(
  @Query('startDate', ParseISO8601DatePipe) startDate: Date,
  @Query('endDate', ParseISO8601DatePipe) endDate: Date,
  @Query('workspaceId') workspaceId?: string,
  @Query('reportId') reportId?: string
) {
  return this.powerbiMetricsService.getViewCountsByDate(startDate, endDate, workspaceId, reportId);
}

@Get('top-reports')
async getTopReports(
  @Query('startDate', ParseISO8601DatePipe) startDate: Date,
  @Query('endDate', ParseISO8601DatePipe) endDate: Date,
  @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  @Query('workspaceId') workspaceId?: string
) {
  
  return this.powerbiMetricsService.getTopReports(startDate, endDate, limit, workspaceId);
}

@Get('top-users')
async getTopUsers(
  @Query('startDate', ParseISO8601DatePipe) startDate: Date,
  @Query('endDate', ParseISO8601DatePipe) endDate: Date,
  @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  @Query('workspaceId') workspaceId?: string,
  @Query('reportId') reportId?: string
) {
  return this.powerbiMetricsService.getTopUsers(startDate, endDate, limit, workspaceId, reportId);
}
@Get('user-report-views-distribution')
async getUserReportViewsDistribution(
  @Query('userId') userId: string,
  @Query('startDate', ParseISO8601DatePipe) startDate: Date,
  @Query('endDate', ParseISO8601DatePipe) endDate: Date,
  @Query('workspaceId') workspaceId?: string
) {
  return this.powerbiMetricsService.getUserReportViewsDistribution(
    userId, 
    startDate, 
    endDate,
    workspaceId
  );
}


@Get('daily-user-reports')
async getDailyUserReportViews(
  @Query('userId') userId: string,
  @Query('date', ParseISO8601DatePipe) date: Date,
  @Query('workspaceId') workspaceId?: string,
  @Query('reportId') reportId?: string
) {
  const startDate = new Date(date);
  startDate.setHours(0,0,0,0);
  
  const endDate = new Date(date);
  endDate.setHours(23,59,59,999);

  return this.powerbiMetricsService.getUserReportViewsDistribution(
    userId,
    startDate,
    endDate,
    workspaceId
  );
}


@Get('unused-reports')
async getUnusedReports(
  @Query('startDate', ParseISO8601DatePipe) startDate: Date,
  @Query('endDate', ParseISO8601DatePipe) endDate: Date,
  @Query('workspaceId') workspaceId?: string
): Promise<{id: number, dashboard: string, groupId: number | null}[]> {
  return this.powerbiMetricsService.getUnusedReports(startDate, endDate, workspaceId);
}

// @Post('user-name-mappings')
// async getUserNameMappings(@Body() body: { emails: string[] }) {
//   return this.powerbiMetricsService.getUserNameMappings(body.emails);
// }
@Post('user-name-mappings')
async getUserNameMappings(@Body() body: { emails: string[] }) {
  return this.powerbiMetricsService.getUserNameMappings(body.emails);
}


@Get('user-counts')
async getUserCounts(
  @Query('startDate', ParseISO8601DatePipe) startDate: Date,
  @Query('endDate', ParseISO8601DatePipe) endDate: Date,
  @Query('workspaceId') workspaceId?: string,
  @Query('reportId') reportId?: string
) {
  return this.powerbiMetricsService.getUserCounts(
    startDate, 
    endDate,
    workspaceId,
    reportId
  );
}

@Get('workspace/:groupId/members')
async getWorkspaceMembers(@Param('groupId') groupId: string) {
  return this.powerbiMetricsService.getWorkspaceMembers(groupId);
}

@Post('workspace/:groupId/members')
async addWorkspaceMember(
  @Param('groupId') groupId: string,
  @Body() body: { emailAddress: string; accessRight: string },
) {
  return this.powerbiMetricsService.addWorkspaceMember(groupId, body);
}

@Patch('workspace/:groupId/members/:userId')
async updateWorkspaceMember(
  @Param('groupId') groupId: string,
  @Param('userId') userId: string,
  @Body() body: { accessRight: string },
) {
  return this.powerbiMetricsService.updateWorkspaceMember(groupId, userId, body);
}

@Delete('workspace/:groupId/members/:userId')
async removeWorkspaceMember(
  @Param('groupId') groupId: string,
  @Param('userId') userId: string,
) {
  return this.powerbiMetricsService.removeWorkspaceMember(groupId, userId);
}

@Post('time-spent')
async recordTimeSpent(
  @Body() data: {
    userId: string;
    reportId: string;
    reportName: string;
    workspaceId?: string;
    workspaceName?: string;
    tabName: string;
    durationSeconds: number;
  }
) {
  if (!data.userId || !data.reportId || !data.tabName || typeof data.durationSeconds !== 'number') {
    throw new BadRequestException('userId, reportId, tabName, and durationSeconds are required.');
  }
  return this.powerbiMetricsService.saveTimeSpent(data);
}

@Get('user-time-spent')
async getUserTimeSpent(
  @Query('userId') userId: string,
  @Query('startDate', ParseISO8601DatePipe) startDate: Date,
  @Query('endDate', ParseISO8601DatePipe) endDate: Date
) {
  if (!userId) {
    throw new BadRequestException('userId is required.');
  }
  return this.powerbiMetricsService.getUserTimeSpentDistribution(userId, startDate, endDate);
}

@Get('last-refresh')
async getLastRefresh() {
  return this.powerbiMetricsService.getLastRefreshTime();
}

@Get('dashboard-usage')
async getDashboardUsage(
  @Query('dashboardName') dashboardName: string,
  @Query('startDate', new DefaultValuePipe(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)), ParseISO8601DatePipe) startDate: Date,
  @Query('endDate', new DefaultValuePipe(new Date()), ParseISO8601DatePipe) endDate: Date,
  @Query('workspaceId') workspaceId?: string
) {
  if (!dashboardName) throw new BadRequestException('dashboardName is required');
  return this.powerbiMetricsService.getDashboardUsage(dashboardName, workspaceId, startDate, endDate);
}

@Get('time-spent-overview')
async getTimeSpentOverview(
  @Query('startDate', new DefaultValuePipe(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)), ParseISO8601DatePipe) startDate: Date,
  @Query('endDate', new DefaultValuePipe(new Date()), ParseISO8601DatePipe) endDate: Date,
  @Query('workspaceId') workspaceId?: string
) {
  return this.powerbiMetricsService.getTimeSpentOverview(startDate, endDate, workspaceId);
}
}