import { Repository } from 'typeorm';
import { UserMapping } from './entities/user-mapping.entity';
export declare class UserMappingsService {
    private readonly userMappingRepo;
    constructor(userMappingRepo: Repository<UserMapping>);
    findByEmail(email: string): Promise<UserMapping | null>;
    upsert(email: string, realName: string): Promise<UserMapping>;
    findAll(): Promise<UserMapping[]>;
}
