import { Repository } from 'typeorm';
import { CreateWebtoolUserDto } from './dto/create-webtool-user.dto';
import { UserWebtool } from '../user-webtool/entities/user-webtool.entity';
export declare class WebtoolUserService {
    private readonly webtoolUserRepository;
    constructor(webtoolUserRepository: Repository<UserWebtool>);
    findAll(): Promise<any[]>;
    create(createWebtoolUserDto: CreateWebtoolUserDto): Promise<UserWebtool>;
    findOne(id: number): Promise<UserWebtool>;
    remove(email: string, webtoolId: number): Promise<string>;
}
