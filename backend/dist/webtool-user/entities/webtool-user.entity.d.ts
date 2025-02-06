import { Role } from "src/roles/entities/role.entity";
import { Webtool } from "src/webtool/entities/webtool.entity";
export declare class UserWebtool {
    id: number;
    email: string;
    userName: string;
    department: string;
    webtool: Webtool;
    webtoolId: number;
    roles: Role[];
}
