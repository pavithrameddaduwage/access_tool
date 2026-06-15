import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { RoleMaster } from './entities/role_master.entity';
import { UserRoles } from './entities/user_roles.entity';
export declare class UsersService {
    private userRepository;
    private roleRepository;
    private userrolesRepository;
    constructor(userRepository: Repository<User>, roleRepository: Repository<RoleMaster>, userrolesRepository: Repository<UserRoles>);
    create(createUserDto: CreateUserDto): Promise<User>;
    private validateRoles;
    update(id: number, updateUserDto: UpdateUserDto): Promise<User>;
    findAll(): Promise<User[]>;
    findAllRoles(): Promise<RoleMaster[]>;
    findUserById(id: number): Promise<User>;
    findUserByEmail(email: string): Promise<User>;
    searchLocalUsers(query: string): Promise<any[]>;
    remove(id: number): Promise<void>;
}
