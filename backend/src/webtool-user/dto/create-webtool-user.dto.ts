import { IsNumber, IsArray, IsString, IsEmail } from 'class-validator';

export class CreateWebtoolUserDto {
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