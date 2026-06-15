import { Controller, Get, Post, Query, ParseIntPipe } from '@nestjs/common';
import { ActivityService } from './activity.service';
import { PbiActivityEvent } from './entities/pbi-activity-event.entity';

@Controller('api/activity')
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Get()
  async getFilteredActivities(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('userId') userId?: string,
    @Query('workspaceId') workspaceId?: string,
    @Query('reportId') reportId?: string,
  ): Promise<PbiActivityEvent[]> {
    return this.activityService.findFiltered({ from, to, userId, workspaceId, reportId });
  }

  @Get('sync-status')
  async getSyncStatus(): Promise<any> {
    const isBackfilling = await this.activityService.getIsBackfilling();
    const logs = await this.activityService.getSyncStatus();
    return {
      isBackfilling,
      logs,
    };
  }

  @Post('backfill')
  async triggerBackfill(@Query('days') days?: string): Promise<{ message: string }> {
    const daysCount = days ? parseInt(days, 10) : 90;
    this.activityService.triggerBackfill(daysCount).catch(() => {});
    return { message: `Historical backfill for the last ${daysCount} days triggered successfully.` };
  }
}
