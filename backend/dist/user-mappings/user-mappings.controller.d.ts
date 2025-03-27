import { UserMappingsService } from "./user-mappings.service";
import { UserMapping } from "./entities/user-mapping.entity";
export declare class UserMappingsController {
    private readonly userMappingsService;
    constructor(userMappingsService: UserMappingsService);
    getMapping(email: string): Promise<UserMapping | null>;
    createMapping(body: {
        email: string;
        realName: string;
    }): Promise<UserMapping>;
}
