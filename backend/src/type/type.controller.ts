import { Controller, Get, Post, Body, Patch, Param, Delete, NotFoundException, Put } from '@nestjs/common';
import { TypeService } from './type.service';
import { CreateTypeDto } from './dto/create-type.dto';
import { UpdateTypeDto } from './dto/update-type.dto';
import { Public } from 'src/auth/decorators/public.decorator';

@Controller('type')
export class TypeController {
  constructor(private readonly typeService: TypeService) {}

  @Get()
    async getAllTypes() {
      return this.typeService.getAllTypes();
    }
  
    @Get(':id')
    async getTypeById(@Param('id') id: number) {
      const type = await this.typeService.getTypeById(id);
      if (!type) {
        throw new NotFoundException(`Type with ID ${id} not found.`);
      }
      return type;
    }
  
    @Post()
    async createType(@Body() CreateTypeDto: CreateTypeDto) {
      return this.typeService.createType(CreateTypeDto);
    }
  

    @Put(':id')
    async updateType(
      @Param('id') id: number,
      @Body() UpdateTypeDto: UpdateTypeDto,
    ) {
      const type = await this.typeService.getTypeById(id);
      if (!type) {
        throw new NotFoundException(`Type with ID ${id} not found.`);
      }
      return this.typeService.updateType(id, UpdateTypeDto);
    }


  
    @Delete(':id')
    async deleteType (@Param('id') id: number) {
      const type = await this.typeService.getTypeById(id);
      if (!type) {
        throw new NotFoundException(`Type with ID ${id} not found.`);
      }
      return this.typeService.deleteType(id);
    }
}
