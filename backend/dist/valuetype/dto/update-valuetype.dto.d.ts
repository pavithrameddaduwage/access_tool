import { CreateValuetypeDto } from './create-valuetype.dto';
declare const UpdateValuetypeDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateValuetypeDto>>;
export declare class UpdateValuetypeDto extends UpdateValuetypeDto_base {
    valuetype?: string;
}
export {};
