import { CreateWebtoolDto } from './create-webtool.dto';
declare const UpdateWebtoolDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateWebtoolDto>>;
export declare class UpdateWebtoolDto extends UpdateWebtoolDto_base {
    webtool?: string;
}
export {};
