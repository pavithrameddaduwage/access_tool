import { PartialType } from '@nestjs/mapped-types';
import { CreateWebtoolDto } from './create-webtool.dto';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateWebtoolDto extends PartialType(CreateWebtoolDto) {

    
          @IsString()
          @IsOptional()
          @IsNotEmpty()
          webtool?: string;  
      
}
