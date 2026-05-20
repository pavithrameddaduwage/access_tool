// user-dashboard.controller.ts
import { Controller, Get, Post, Body, Put, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { UserDashboardService } from './user-dashboard.service';
import { CreateUserDashboardDto } from './dto/create-user-dashboard.dto';
import { UpdateUserDashboardDto } from './dto/update-user-dashboard.dto';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { UserMetric } from 'src/powerbi-metrics/powerbi-metrics.service';

@Controller('user-dashboards')
export class UserDashboardController {
  constructor(private readonly userDashboardService: UserDashboardService) {}

  @Post()
  create(@Body() createUserDashboardDto: CreateUserDashboardDto) {
    return this.userDashboardService.create(createUserDashboardDto);
  }

  @Get()
  findAll() {
    return this.userDashboardService.findAll();
  }

  @Get(':email')
  findOne(@Param('email') email: string) {
    return this.userDashboardService.findOne(email);
  }

  @Put(':email')
  update(
    @Param('email') email: string,
    @Body() updateUserDashboardDto: UpdateUserDashboardDto
  ) {
    return this.userDashboardService.update(email, updateUserDashboardDto);
  }

  @Delete(':email')
  remove(@Param('email') email: string) {
    return this.userDashboardService.remove(email);
  }

  @Get('database/database-users')
  async getDatabaseUsers() {
    // console.log('testing')
  return this.userDashboardService.getDatabaseUsers();
  
}
@Get('permitted')
async permittedUsers(
  @Query('workspaceId') workspaceId?: string,
  @Query('reportId') reportId?: string
): Promise<string[]> {
  return this.userDashboardService.getPermittedUsers(workspaceId, reportId);
}

@Post('activeUsers/getDatabaseUsersByWorkspaceAndReportID')
async getDatabaseUsersByWorkspaceAndReportID(@Body() data: { workspaceName: string, reportName: string }

): Promise<UserMetric[]> {
  return this.userDashboardService.getDatabaseUsersByWorkspaceAndReportID(data.workspaceName, data.reportName);
}

@Get('last-deactivated')
async getLastDeactivatedUsers(@Query('limit') limit: number = 5) {
  return this.userDashboardService.getLastDeactivatedUsers(limit);
}

@Post('sync-departments')
  async syncDepartments() {
    return await this.userDashboardService.syncDepartmentsManually();
  }
}