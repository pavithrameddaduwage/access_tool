import { Repository } from "typeorm";
import { UserWebtool } from "./entities/user-webtool.entity";
import { CreateUserWebtoolDto } from "./dto/create-user-webtool.dto";
import { Webtool } from "../webtool/entities/webtool.entity";
import { Role } from "../roles/entities/role.entity";
export declare class UserWebtoolService {
    private userWebtoolRepository;
    private webtoolRepository;
    private roleRepository;
    constructor(userWebtoolRepository: Repository<UserWebtool>, webtoolRepository: Repository<Webtool>, roleRepository: Repository<Role>);
    create(createUserWebtoolDto: CreateUserWebtoolDto): Promise<UserWebtool>;
    removeRole(email: string, webtoolId: number, roleId: number): Promise<void>;
    getUserWebtoolsByUser(email: string): Promise<UserWebtool[]>;
    findAll(): Promise<any[]>;
    findOne(id: number): Promise<UserWebtool>;
    remove(email: string, webtoolId: number): Promise<void>;
}
