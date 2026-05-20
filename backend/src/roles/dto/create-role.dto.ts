import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateRoleDto {

    @IsString()
    @IsNotEmpty()
    roles: string;
  
    @IsString()
    @IsNotEmpty()
    privileges: string;
  
    @IsNumber()
    @IsNotEmpty()
    webtoolId: number;
    
}
