export class CreateUserDto {
    email: string;
    name: string;
    is_active: boolean;
    user_roles?: { roleId: number }[];
}