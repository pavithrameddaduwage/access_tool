export interface CreateWebtoolDto {
    webtool: string;
}
export interface CreateUserWebtoolDto {
    email: string;
    userName: string;
    department: string;
    webtoolId: number;
    roleId: number;
}
export interface CreateUserWebtoolsDto {
    email: string;
    userName: string;
    department: string;
    webtoolRoles: Array<{
        webtoolId: number;
        roleIds: number[];
    }>;
}
