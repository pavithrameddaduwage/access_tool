import { PartialType } from '@nestjs/mapped-types';
import { CreateUserWebtoolDto } from './create-user-webtool.dto';
import { IsBoolean, IsDate, IsOptional } from 'class-validator';

export class UpdateUserWebtoolDto extends PartialType(CreateUserWebtoolDto) {
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
  
    @IsDate()
    @IsOptional()
    lastActiveAt?: Date;
  }