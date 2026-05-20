import { Controller, Get, Post, Body, Patch, Param, Delete, NotFoundException, Put } from '@nestjs/common';
import { ValuetypeService } from './valuetype.service';
import { CreateValuetypeDto } from './dto/create-valuetype.dto';
import { UpdateValuetypeDto } from './dto/update-valuetype.dto';

@Controller('valuetype')
export class ValuetypeController {
  constructor(private readonly valuetypeService: ValuetypeService) {}

 @Get()
    async getAllValueTypes() {
      return this.valuetypeService.getAllValueTypes();
    }
  
    @Get(':id')
    async getValueTypeById(@Param('id') id: number) {
      const valuetype = await this.valuetypeService.getValueTypeById(id);
      if (!valuetype) {
        throw new NotFoundException(`Value Type with ID ${id} not found.`);
      }
      return valuetype;
    }
  
    @Post()
    async createValueType(@Body() CreateValuetypeDto: CreateValuetypeDto) {
      return this.valuetypeService.createValueType(CreateValuetypeDto);
    }
  

    @Put(':id')
    async updateType(
      @Param('id') id: number,
      @Body() UpdateValuetypeDto: UpdateValuetypeDto,
    ) {
      const valuetype = await this.valuetypeService.getValueTypeById(id);
      if (!valuetype) {
        throw new NotFoundException(`Value Type with ID ${id} not found.`);
      }
      return this.valuetypeService.updateValueType(id, UpdateValuetypeDto);
    }


  
    @Delete(':id')
    async deleteType (@Param('id') id: number) {
      const valuetype = await this.valuetypeService.getValueTypeById(id);
      if (!valuetype) {
        throw new NotFoundException(`Value Type with ID ${id} not found.`);
      }
      return this.valuetypeService.deleteValueType(id);
    }
}
