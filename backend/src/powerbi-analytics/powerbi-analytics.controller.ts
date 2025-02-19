import { Controller, Get, Param } from '@nestjs/common';
import { PowerBIService } from './powerbi-analytics.service';

@Controller('powerbi-analytics')
export class PowerBIAnalyticsController {
  constructor(private readonly powerBIService: PowerBIService) {}

  @Get('workspaces')
  getWorkspaces() {
    return this.powerBIService.getWorkspaces();
  }

  // @Get('metrics/workspace/:id')
  // getWorkspaceMetrics(@Param('id') workspaceId: string) {
  //   return this.powerBIService.getWorkspaceUsageMetrics(workspaceId);
  // }

  // @Get('metrics/aggregate')
  // getAggregateMetrics() {
  //   return this.powerBIService.getAggregateMetrics();
  // }


  @Get('test')
  async testConnection() {
    try {
      const workspaces = await this.powerBIService.getWorkspaces();
      return {
        status: 'success',
        message: 'PowerBI connection successful',
        workspaceCount: workspaces.length,
        workspaces: workspaces.map(ws => ({
          id: ws.id,
          name: ws.name
        }))
      };
    } catch (error) {
      return {
        status: 'error',
        message: error.message
      };
    }
  }
}