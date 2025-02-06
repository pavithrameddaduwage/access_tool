import { CreateUserDto } from './create-user.dto';
declare const UpdateUserDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateUserDto>>;
export declare class UpdateUserDto extends UpdateUserDto_base {
    email?: string;
    name?: string;
    is_active?: boolean;
    user_roles?: {
        roleId: number;
    }[];
}
export {};
