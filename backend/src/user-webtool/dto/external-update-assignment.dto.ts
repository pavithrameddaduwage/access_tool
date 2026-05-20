// src/user-webtool/dto/external-webtool-update.dto.ts
import { IsEmail, IsNumber, IsString, IsArray, IsBoolean, IsOptional } from 'class-validator';

export class ExternalWebtoolUpdateDto {
  @IsString()
  @IsEmail()
  email: string;

  @IsNumber()
  webtoolId: number;

  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  roleIdsToAdd?: number[];

  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  roleIdsToRemove?: number[];

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  userName?: string;

  @IsString()
  @IsOptional()
  department?: string;
}