import { IsNotEmpty, IsString } from "class-validator";

export class CreateValuetypeDto {
       @IsString()
          @IsNotEmpty()
          valuetype: string; 
}
