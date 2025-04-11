import { Webtool } from '../../webtool/entities/webtool.entity';
import { Role } from '../../roles/entities/role.entity';
export declare class UserWebtool {
    id: number;
    email: string;
    userName: string;
    department: string;
    webtoolId: number;
    roleId: number;
    webtool: Webtool;
    role: Role;
    isActive: boolean;
    lastActiveAt: Date;
}
