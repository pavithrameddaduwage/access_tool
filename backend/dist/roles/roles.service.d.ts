import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { Role } from './entities/role.entity';
import { Repository } from 'typeorm';
import { Webtool } from 'src/webtool/entities/webtool.entity';
export declare class RolesService {
    private readonly roleRepository;
    private readonly webtoolRepository;
    constructor(roleRepository: Repository<Role>, webtoolRepository: Repository<Webtool>);
    getRolesByWebtool(webtoolId: number): Promise<Role[]>;
    createRole(createRoleDto: CreateRoleDto): Promise<Role>;
    getAllRoles(): Promise<Role[]>;
    getRoleById(id: number): Promise<Role>;
    updateRole(id: number, updateRoleDto: UpdateRoleDto): Promise<Role>;
    deleteRole(id: number): Promise<void>;
}
