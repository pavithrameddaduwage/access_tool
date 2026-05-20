import { Controller, Get, Param, Post, Body, Put, Delete, NotFoundException } from '@nestjs/common';
import { DepartmentService } from './department.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';

@Controller('departments') 
export class DepartmentController {
  constructor(private readonly departmentService: DepartmentService) {}

  @Get()
  async getAllDepartments() {
    return this.departmentService.getAllDepartments();
  }

  @Get(':id')
  async getDepartmentById(@Param('id') id: number) {
    const department = await this.departmentService.getDepartmentById(id);
    if (!department) {
      throw new NotFoundException(`Department with ID ${id} not found.`);
    }
    return department;
  }

  @Post()
  async createDepartment(@Body() createDepartmentDto: CreateDepartmentDto) {
    return this.departmentService.createDepartment(createDepartmentDto);
  }

  @Put(':id')
  async updateDepartment(
    @Param('id') id: number,
    @Body() updateDepartmentDto: UpdateDepartmentDto,
  ) {
    const department = await this.departmentService.getDepartmentById(id);
    if (!department) {
      throw new NotFoundException(`Department with ID ${id} not found.`);
    }
    return this.departmentService.updateDepartment(id, updateDepartmentDto);
  }

  @Delete(':id')
  async deleteDepartment(@Param('id') id: number) {
    const department = await this.departmentService.getDepartmentById(id);
    if (!department) {
      throw new NotFoundException(`Department with ID ${id} not found.`);
    }
    return this.departmentService.deleteDepartment(id);
  }
}
