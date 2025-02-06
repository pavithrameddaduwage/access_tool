import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateWebtoolDto } from './dto/create-webtool.dto';
import { UpdateWebtoolDto } from './dto/update-webtool.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Webtool } from './entities/webtool.entity';
import { Repository } from 'typeorm';

@Injectable()
export class WebtoolService {
   constructor(
     @InjectRepository(Webtool) private readonly webtoolRepository: Repository<Webtool>,
   ) {}
 
 
   async createWebtool(createWebtoolDto: CreateWebtoolDto) {
    // Check if webtool already exists
    const existingWebtool = await this.webtoolRepository.findOne({
      where: { webtool: createWebtoolDto.webtool }
    });

    if (existingWebtool) {
      throw new ConflictException(`Web Tool "${createWebtoolDto.webtool}" already exists`);
    }

    return this.webtoolRepository.save(createWebtoolDto);
  }
   async getAllWebtool() {
     return this.webtoolRepository.find({order: {'webtool':'ASC'}});
   }
 
 
   async getWebtoolById(id: number) {
    const webtool = await this.webtoolRepository.findOne({
      where: { id },
    });

    if (!webtool) {
      throw new NotFoundException(`Web Tool with ID ${id} not found`);
    }

    return webtool;
  }
 
 
  async updateWebtool(id: number, updateWebtoolDto: UpdateWebtoolDto) {
    const webtool = await this.webtoolRepository.findOne({
      where: { id },
    });

    if (!webtool) {
      throw new NotFoundException(`Web Tool with ID ${id} not found`);
    }

    // Check if updated name conflicts with existing webtool
    if (updateWebtoolDto.webtool && updateWebtoolDto.webtool !== webtool.webtool) {
      const existingWebtool = await this.webtoolRepository.findOne({
        where: { webtool: updateWebtoolDto.webtool }
      });

      if (existingWebtool && existingWebtool.id !== id) {
        throw new ConflictException(`Web Tool "${updateWebtoolDto.webtool}" already exists`);
      }
    }

    return this.webtoolRepository.save(Object.assign(webtool, updateWebtoolDto));
  }
 
  async deleteWebtool(id: number) {
    const webtool = await this.webtoolRepository.findOne({
      where: { id },
    });

    if (!webtool) {
      throw new NotFoundException(`Web Tool with ID ${id} not found`);
    }

    try {
      await this.webtoolRepository.remove(webtool);
    } catch (error) {
      if (error.code === '23503') { // Foreign key violation
        throw new ConflictException('Cannot delete Web Tool as it is being used by roles');
      }
      throw error;
    }
  }
}
