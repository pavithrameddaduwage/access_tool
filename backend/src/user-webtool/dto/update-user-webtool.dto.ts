import { PartialType } from '@nestjs/mapped-types';
import { CreateUserWebtoolDto } from './create-user-webtool.dto';

export class UpdateUserWebtoolDto extends PartialType(CreateUserWebtoolDto) {}
