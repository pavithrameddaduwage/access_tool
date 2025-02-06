import { CreateWebtoolUserDto } from './create-webtool-user.dto';
declare const UpdateWebtoolUserDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateWebtoolUserDto>>;
export declare class UpdateWebtoolUserDto extends UpdateWebtoolUserDto_base {
    roleIds: number[];
}
export {};
