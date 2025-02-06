import { UserRoles } from "./user_roles.entity";
export declare class User {
    id: number;
    email: string;
    name: string;
    user_roles: UserRoles[];
    is_active: boolean;
}
