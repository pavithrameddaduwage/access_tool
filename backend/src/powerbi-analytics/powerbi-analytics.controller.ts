import { Body, Controller, Get, HttpException, HttpStatus, Param, Post, Query, Res } from '@nestjs/common';
import { PowerBIService } from './powerbi-analytics.service';
import { UsageMetrics } from './models/usage-metrics.model';
import { Response } from 'express';
import { Logger } from '@nestjs/common';

@Controller('powerbi-analytics')
export class PowerBIAnalyticsController {
  constructor(private readonly powerBIService: PowerBIService) {}
  private readonly logger = new Logger(PowerBIAnalyticsController.name);
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




  // Add these new endpoints to your controller
@Get('workspaces/access')
async getMyWorkspaceAccess() {
  return this.powerBIService.getMyWorkspaceAccess();
}



@Get('workspace/:id')
async getSpecificWorkspace(@Param('id') workspaceId: string) {
  return this.powerBIService.getSpecificWorkspace(workspaceId);
}

@Get('workspace/:id/reports')
async getReports(@Param('id') workspaceId: string) {
  return this.powerBIService.getReports(workspaceId);
}

@Get('workspaces')
async getAllWorkspaces() {
  return this.powerBIService.getAllWorkspaces();
}



// Add these methods to your PowerBIController

@Get('metrics/report/:workspaceId/:reportId')
async getReportUsageMetrics(
  @Param('workspaceId') workspaceId: string,
  @Param('reportId') reportId: string
) {
  return this.powerBIService.getReportUsageMetrics(workspaceId, reportId);
}

@Get('metrics/workspace/:id')
async getWorkspaceUsageMetrics(@Param('id') workspaceId: string) {
  return this.powerBIService.getWorkspaceUsageMetrics(workspaceId);
}

@Get('metrics/aggregate')
async getAggregateMetrics() {
  return this.powerBIService.getAggregateMetrics();
}

@Get('just')
async getData()
 {
  return this.powerBIService.getData();
}

@Get('token')
async getToken()
 {
  return this.powerBIService.getAccessToken();
}



@Get('workspace/:workspaceId/dataset/:datasetId/tables')
async getDatasetTables(
  @Param('workspaceId') workspaceId: string,
  @Param('datasetId') datasetId: string
) {
  return this.powerBIService.getDatasetTables(workspaceId, datasetId);
}

@Post('workspace/:workspaceId/dataset/:datasetId/data')
async getReportData(
  @Param('workspaceId') workspaceId: string,
  @Param('datasetId') datasetId: string
) {
  return this.powerBIService.getReportData(workspaceId, datasetId);
}





@Get('workspace/:workspaceId/report/:reportId/export')
async exportReport(
  @Param('workspaceId') workspaceId: string,
  @Param('reportId') reportId: string,
  @Res() res: Response
) {
  try {
    // Get the access token
    const token = await this.powerBIService.getAccessToken();

    // Call the PowerBI API to export the report
    const response = await this.powerBIService.exportReport(workspaceId, reportId, token);

    // Log the response headers for debugging
    this.logger.debug('Response Headers:', response.headers);

    // Extract the filename from the x-powerbi-filename header
    const filename = response.headers['x-powerbi-filename'] || `report-${reportId}.pbix`;

    // Set response headers
    res.setHeader('Content-Type', response.headers['content-type'] || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Stream the binary data to the client
    response.data.pipe(res);
  } catch (error) {
    this.logger.error('Failed to export report:', error.message);
    res.status(500).send(`Failed to export report: ${error.message}`);
  }
}

@Post('groups/:workspaceId/datasets/:datasetId/executeQueries')
async executeQueries(
  @Param('workspaceId') workspaceId: string,
  @Param('datasetId') datasetId: string,
  @Body() fullRequestBody: any // Receive the ENTIRE request body
) {
  return this.powerBIService.executeQueries(
    workspaceId,
    datasetId,
    fullRequestBody // Pass the complete body through
  );
}



// new ones haha
// @Get('metrics/historical')
// async getHistoricalMetrics(
//   @Query('days') days: string,
//   @Query('workspaces') workspaces: string
// ) {
//   return this.powerBIService.getCombinedMetrics(
//     parseInt(days || '30', 10),
//     workspaces?.split(',')
//   );
// }
// @Post('sync')
// async triggerSync() {
//   await this.powerBIService.refreshAllUsageData();
//   return { status: 'Sync initiated' };
// }


@Get('workspaces-with-datasets')
async getWorkspacesWithDatasets() {
  return this.powerBIService.getWorkspacesWithDatasets();
}


@Get('filterable-metrics')
async getFilterableMetrics(
  @Query('workspaceIds') workspaceIds?: string,
  @Query('days') days = '30'
) {
  return this.powerBIService.getFilteredMetrics(
    workspaceIds?.split(','),
    parseInt(days, 10)
  );
}

@Get('combined-metrics')
async getCombinedMetrics(
  @Body('workspaceIds') workspaceIds?: any
) {
  try {
    // const ids = workspaceIds?.split(',')?.filter(id => id.length > 0) || [];
    return await this.powerBIService.getCombinedMetrics(workspaceIds);
  } catch (error) {
    throw new HttpException(
      'Failed to get combined metrics',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}


@Get('groups/:workspaceId/reports')
async getWorkspaceReports(@Param('workspaceId') workspaceId: string) {
  return this.powerBIService.getReports(workspaceId);
}
}

