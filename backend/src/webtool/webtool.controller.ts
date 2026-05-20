import { Controller, Get, Post, Body, Patch, Param, Delete, NotFoundException, Put } from '@nestjs/common';
import { WebtoolService } from './webtool.service';
import { CreateWebtoolDto } from './dto/create-webtool.dto';
import { UpdateWebtoolDto } from './dto/update-webtool.dto';

@Controller('webtool')
export class WebtoolController {
  constructor(private readonly webtoolService: WebtoolService) {}

  @Get()
      async getAllWebtools() {
        return this.webtoolService.getAllWebtool();
      }
    
      @Get(':id')
      async getWebtoolById(@Param('id') id: number) {
        const webtool = await this.webtoolService.getWebtoolById(id);
        if (!webtool) {
          throw new NotFoundException(`Webtool with ID ${id} not found.`);
        }
        return webtool;
      }
    
      @Post()
      async createWebtool(@Body() createWebtoolDto: CreateWebtoolDto) {
        return this.webtoolService.createWebtool(createWebtoolDto);
      }

      
    
  
      @Put(':id')
      async updateWebtool(
        @Param('id') id: number,
        @Body() updateWebtoolDto: UpdateWebtoolDto,
      ) {
        const webtool = await this.webtoolService.getWebtoolById(id);
        if (!webtool) {
          throw new NotFoundException(`Web tool with ID ${id} not found.`);
        }
        return this.webtoolService.updateWebtool(id, updateWebtoolDto);
      }
  
  
    
      @Delete(':id')
      async deleteWebtool (@Param('id') id: number) {
        const webtool = await this.webtoolService.getWebtoolById(id);
        if (!webtool) {
          throw new NotFoundException(`Webtool with ID ${id} not found.`);
        }
        return this.webtoolService.deleteWebtool(id);
      }
}
