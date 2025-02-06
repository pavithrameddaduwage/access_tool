import { UserRoles } from "./user_roles.entity";
import { RoleAccess } from "./role_access.entity";
export declare class RoleMaster {
    id: number;
    role: string;
    user_roles: UserRoles[];
    role_access: RoleAccess[];
}
