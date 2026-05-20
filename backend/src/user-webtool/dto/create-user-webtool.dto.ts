
import { IsBoolean, IsEmail, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateUserWebtoolDto {
  @IsString()
  @IsEmail()
  email: string;

  @IsString()
  userName: string;

  @IsString()
  department: string;

  @IsNumber()
  webtoolId: number;

  @IsNumber()
  roleId: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}