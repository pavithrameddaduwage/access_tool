import { PartialType } from '@nestjs/mapped-types';
import { CreateTypeDto } from './create-type.dto';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateTypeDto extends PartialType(CreateTypeDto) {


      @IsString()
      @IsOptional()
      @IsNotEmpty()
      type?: string;  
  

}
