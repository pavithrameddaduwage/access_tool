import { PartialType } from '@nestjs/mapped-types';
import { CreateValuetypeDto } from './create-valuetype.dto';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateValuetypeDto extends PartialType(CreateValuetypeDto) {

    
          @IsString()
          @IsOptional()
          @IsNotEmpty()
          valuetype?: string;  
      
    
}
