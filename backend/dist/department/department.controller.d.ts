import { DepartmentService } from './department.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
export declare class DepartmentController {
    private readonly departmentService;
    constructor(departmentService: DepartmentService);
    getAllDepartments(): Promise<import("./entities/department.entity").Department[]>;
    getDepartmentById(id: number): Promise<import("./entities/department.entity").Department>;
    createDepartment(createDepartmentDto: CreateDepartmentDto): Promise<CreateDepartmentDto & import("./entities/department.entity").Department>;
    updateDepartment(id: number, updateDepartmentDto: UpdateDepartmentDto): Promise<import("./entities/department.entity").Department & UpdateDepartmentDto>;
    deleteDepartment(id: number): Promise<void>;
}
