// user-dashboard.controller.ts
import { Controller, Get, Post, Body, Put, Param, Delete, UseGuards } from '@nestjs/common';
import { UserDashboardService } from './user-dashboard.service';
import { CreateUserDashboardDto } from './dto/create-user-dashboard.dto';
import { UpdateUserDashboardDto } from './dto/update-user-dashboard.dto';
import { AuthGuard } from 'src/auth/guards/auth.guard';

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
    console.log('testing')
  return this.userDashboardService.getDatabaseUsers();
  
}
}
