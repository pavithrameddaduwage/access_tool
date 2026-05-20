import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateWebtoolDto {
   @IsString()
   @IsNotEmpty()
   webtool: string;
 
   @IsString()
   @IsOptional()
   description: string;
 }