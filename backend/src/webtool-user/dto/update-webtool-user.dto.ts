import { PartialType } from '@nestjs/mapped-types';
import { CreateWebtoolUserDto } from './create-webtool-user.dto';

export class UpdateWebtoolUserDto extends PartialType(CreateWebtoolUserDto) {
    roleIds: number[];

}
