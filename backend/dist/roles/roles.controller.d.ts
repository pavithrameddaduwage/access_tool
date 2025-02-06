import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
export declare class RolesController {
    private readonly rolesService;
    constructor(rolesService: RolesService);
    getAllRoles(): Promise<import("./entities/role.entity").Role[]>;
    getRoleById(id: number): Promise<import("./entities/role.entity").Role>;
    getRolesByWebtool(webtoolId: string): Promise<import("./entities/role.entity").Role[]>;
    createRole(createRoleDto: CreateRoleDto): Promise<import("./entities/role.entity").Role>;
    updateWebtool(id: number, updateRoleDto: UpdateRoleDto): Promise<import("./entities/role.entity").Role>;
    deleteRole(id: number): Promise<void>;
}
