import { Repository } from "typeorm";
import { UserWebtool } from "./entities/user-webtool.entity";
import { CreateUserWebtoolDto } from "./dto/create-user-webtool.dto";
import { Webtool } from "../webtool/entities/webtool.entity";
import { Role } from "../roles/entities/role.entity";
import { ExternalWebtoolAssignmentDto } from "./dto/external-webtool-assignment.dto";
import { ExternalDeleteAssignmentDto } from "./dto/external-delete-assignment.dto";
import { UpdateUserWebtoolDto } from "./dto/update-user-webtool.dto";
import { ExternalWebtoolUpdateDto } from "./dto/external-update-assignment.dto";
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
    private findExistingEmail;
    createExternalAssignment(dto: ExternalWebtoolAssignmentDto): Promise<void>;
    deleteExternalAssignment(dto: ExternalDeleteAssignmentDto): Promise<{
        success: boolean;
        message: string;
        data: {
            email: string;
            webtoolId: number;
        };
    }>;
    updateActiveStatus(email: string, webtoolId: number, isActive: boolean): Promise<void>;
    update(id: number, updateDto: UpdateUserWebtoolDto): Promise<UserWebtool>;
    findAllRaw(): Promise<UserWebtool[]>;
    updateExternalAssignment(dto: ExternalWebtoolUpdateDto): Promise<{
        success: boolean;
        message: string;
        data: {
            email: string;
            webtool: string;
            roles: {
                id: number;
                name: string;
            }[];
            isActive: boolean;
        };
    }>;
}
