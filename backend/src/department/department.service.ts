import { Injectable } from '@nestjs/common';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Department } from './entities/department.entity';
import { Repository } from 'typeorm';



@Injectable()
export class DepartmentService {

  constructor(
    @InjectRepository(Department) private departmentRepository: Repository<Department>
  ) {}



  async getAllDepartments() {
    return this.departmentRepository.find({order: {'department':'ASC'}});
  }

  async getDepartmentById(id: number) {
    return this.departmentRepository.findOne({
      where: { id }, 
    });
  }

  async createDepartment(createDepartmentDto: CreateDepartmentDto) {
    return this.departmentRepository.save(createDepartmentDto);
  }
  // async getDepartmentByName(name: string) {
  //   return this.departmentRepository.findOne({
  //     where: { department: name }, 
  //   });


  async updateDepartment(id: number, updateDepartmentDto: UpdateDepartmentDto) {
    const department = await this.departmentRepository.findOne({
      where: { id }, 
    });
    if (!department) {
      throw new Error(`Department with ID ${id} not found.`);
    }
    return this.departmentRepository.save(Object.assign(department, updateDepartmentDto));
  }

  async deleteDepartment(id: number) {
    const department = await this.departmentRepository.findOne({
      where: { id }, 
    });
    if (!department) {
      throw new Error(`Department with ID ${id} not found.`);
    }
    await this.departmentRepository.remove(department);
  }


}
