import { IsEmail, IsNumber, IsString, IsArray } from 'class-validator';

export class ExternalWebtoolAssignmentDto {
  @IsString()
  @IsEmail()
  email: string;

  @IsString()
  userName: string;

  @IsString()
  department: string;

  @IsNumber()
  webtoolId: number;

  @IsArray()
  @IsNumber({}, { each: true })
  roleIds: number[];
}