import { UserWebtoolService } from './user-webtool.service';
import { CreateUserWebtoolDto } from './dto/create-user-webtool.dto';
export declare class UserWebtoolController {
    private readonly userWebtoolService;
    constructor(userWebtoolService: UserWebtoolService);
    create(createUserWebtoolDto: CreateUserWebtoolDto): Promise<import("./entities/user-webtool.entity").UserWebtool>;
    findAll(): Promise<any[]>;
    findOne(id: string): Promise<import("./entities/user-webtool.entity").UserWebtool>;
    remove(email: string, webtoolId: string): Promise<void>;
    getUserWebtoolsByUser(email: string): Promise<import("./entities/user-webtool.entity").UserWebtool[]>;
    removeRole(email: string, webtoolId: string, roleId: string): Promise<void>;
}
