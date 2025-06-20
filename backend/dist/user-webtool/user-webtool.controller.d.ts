import { UserWebtoolService } from './user-webtool.service';
import { CreateUserWebtoolDto } from './dto/create-user-webtool.dto';
import { ExternalWebtoolAssignmentDto } from './dto/external-webtool-assignment.dto';
import { ExternalDeleteAssignmentDto } from './dto/external-delete-assignment.dto';
import { ExternalWebtoolUpdateDto } from './dto/external-update-assignment.dto';
export declare class UserWebtoolController {
    private readonly userWebtoolService;
    constructor(userWebtoolService: UserWebtoolService);
    create(createUserWebtoolDto: CreateUserWebtoolDto): Promise<import("./entities/user-webtool.entity").UserWebtool>;
    findAll(): Promise<any[]>;
    findOne(id: string): Promise<import("./entities/user-webtool.entity").UserWebtool>;
    remove(email: string, webtoolId: string): Promise<void>;
    getUserWebtoolsByUser(email: string): Promise<import("./entities/user-webtool.entity").UserWebtool[]>;
    removeRole(email: string, webtoolId: string, roleId: string): Promise<void>;
    createExternalAssignment(dto: ExternalWebtoolAssignmentDto, req: Request): Promise<void>;
    deleteExternalAssignment(dto: ExternalDeleteAssignmentDto): Promise<{
        success: boolean;
        message: string;
        data: {
            email: string;
            webtoolId: number;
        };
    }>;
    updateStatus(email: string, webtoolId: number, dto: {
        isActive: boolean;
    }): Promise<void>;
    getAllRawUserWebtools(): Promise<import("./entities/user-webtool.entity").UserWebtool[]>;
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
