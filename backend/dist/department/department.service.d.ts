import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { Department } from './entities/department.entity';
import { Repository } from 'typeorm';
export declare class DepartmentService {
    private departmentRepository;
    constructor(departmentRepository: Repository<Department>);
    getAllDepartments(): Promise<Department[]>;
    getDepartmentById(id: number): Promise<Department>;
    createDepartment(createDepartmentDto: CreateDepartmentDto): Promise<CreateDepartmentDto & Department>;
    updateDepartment(id: number, updateDepartmentDto: UpdateDepartmentDto): Promise<Department & UpdateDepartmentDto>;
    deleteDepartment(id: number): Promise<void>;
}
