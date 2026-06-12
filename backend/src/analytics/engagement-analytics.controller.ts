import { Controller, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';
import {
  EngagementAnalyticsService,
  OverviewResult,
  TopViewRow,
  UserViewRow,
  ComponentViewerRow,
  UserRow,
  DashboardRow,
  ReportRow,
  UserDetailResult,
} from './engagement-analytics.service';

/**
 * v2 engagement analytics.
 *
 * Mounted at `api/analytics/engagement` (not bare `analytics`) to avoid
 * colliding with the existing `api/analytics` Power BI analytics controller.
 * Guarded by the global `AuthGuard` like the other analytics surfaces.
 */
@Controller('api/analytics/engagement')
@UseGuards(AuthGuard)
export class EngagementAnalyticsController {
  constructor(private readonly analytics: EngagementAnalyticsService) {}

  /** KPI overview for the period. */
  @Get('overview')
  getOverview(@Query() query: AnalyticsQueryDto): Promise<OverviewResult> {
    return this.analytics.getOverview(query);
  }

  /** Per-dashboard engagement rollup. */
  @Get('dashboards')
  getDashboards(@Query() query: AnalyticsQueryDto): Promise<DashboardRow[]> {
    return this.analytics.getDashboards(query);
  }

  /** Per-report Power BI audit rollup. */
  @Get('reports')
  getReports(@Query() query: AnalyticsQueryDto): Promise<ReportRow[]> {
    return this.analytics.getReports(query);
  }

  /** All users with engaged time + view totals. */
  @Get('users')
  getUsers(@Query() query: AnalyticsQueryDto): Promise<UserRow[]> {
    return this.analytics.getUsers(query);
  }

  /** Single-user detail (sessions + views + audit). */
  @Get('users/:id')
  getUserDetail(
    @Param('id') id: string,
    @Query() query: AnalyticsQueryDto,
  ): Promise<UserDetailResult> {
    return this.analytics.getUserDetail(id, query);
  }

  /** Top components by view count (optionally filtered by `?type=`). */
  @Get('views/top')
  getTopViews(
    @Query() query: AnalyticsQueryDto,
    @Query('type') type?: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ): Promise<TopViewRow[]> {
    return this.analytics.getTopViews(query, type, limit ?? 20);
  }

  /** Components viewed by a single user. */
  @Get('views/by-user/:userId')
  getViewsByUser(
    @Param('userId') userId: string,
    @Query() query: AnalyticsQueryDto,
  ): Promise<UserViewRow[]> {
    return this.analytics.getViewsByUser(userId, query);
  }

  /** Users who viewed a single component. */
  @Get('views/by-component/:type/:id')
  getViewsByComponent(
    @Param('type') type: string,
    @Param('id') id: string,
  ): Promise<ComponentViewerRow[]> {
    return this.analytics.getViewsByComponent(type, id);
  }
}
