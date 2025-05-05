import { Controller, Get, Post, Body, Patch, Param, Delete, Put, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { CreateDashboardDto } from './dto/create-dashboard.dto';
import { UpdateDashboardDto } from './dto/update-dashboard.dto';
import { AuthGuard } from 'src/auth/guards/auth.guard';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Post()
  create(@Body() createDashboardDto: CreateDashboardDto) {
    return this.dashboardService.create(createDashboardDto);
  }

  @Get()
  findAll() {
    return this.dashboardService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.dashboardService.findOne(+id);
  }

  @Put(':id') // Change from Patch to Put
  async update(
    @Param('id') id: string, 
    @Body() updateDashboardDto: UpdateDashboardDto
  ) {
    // console.log('Updating dashboard:', { id, data: updateDashboardDto }); // Debug log
    const result = await this.dashboardService.update(+id, updateDashboardDto);
    // console.log('Update result:', result); // Debug log
    return result;
  }
  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      return await this.dashboardService.remove(+id);
    } catch (error) {
      // Log the error for debugging
      console.error('Error in delete controller:', error);
      throw error;
    }
  }
}
