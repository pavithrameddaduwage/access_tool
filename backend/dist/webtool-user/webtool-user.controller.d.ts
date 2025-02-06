import { WebtoolUserService } from "./webtool-user.service";
import { CreateWebtoolUserDto } from "./dto/create-webtool-user.dto";
export declare class WebtoolUserController {
    private readonly webtoolUserService;
    constructor(webtoolUserService: WebtoolUserService);
    findAll(): Promise<any[]>;
    create(createDto: CreateWebtoolUserDto): Promise<import("../user-webtool/entities/user-webtool.entity").UserWebtool>;
    remove(email: string, webtoolId: string): Promise<string>;
}
