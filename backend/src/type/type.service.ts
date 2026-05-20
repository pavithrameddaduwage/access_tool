import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Type } from './entities/type.entity'; // Update the path if necessary
import { CreateTypeDto } from './dto/create-type.dto';
import { UpdateTypeDto } from './dto/update-type.dto';

@Injectable()
export class TypeService {
  constructor(
    @InjectRepository(Type) private readonly typeRepository: Repository<Type>,
  ) {}


  async createType(createTypeDto: CreateTypeDto) {
    // Check if type already exists
    const existingType = await this.typeRepository.findOne({
      where: { type: createTypeDto.type }
    });

    if (existingType) {
      throw new ConflictException(`Type "${createTypeDto.type}" already exists`);
    }

    return this.typeRepository.save(createTypeDto);
  }


  async getAllTypes() {
    return this.typeRepository.find({order: {'type':'ASC'}});
  }


  async getTypeById(id: number) {
    return this.typeRepository.findOne({
      where: { id }, 
    });
  }



  async updateType(id: number, updateTypeDto: UpdateTypeDto) {
    // Check if type exists
    const type = await this.typeRepository.findOne({
      where: { id },
    });
    
    if (!type) {
      throw new NotFoundException(`Type with ID ${id} not found`);
    }

    // Check if updated name conflicts with existing type
    if (updateTypeDto.type) {
      const existingType = await this.typeRepository.findOne({
        where: { type: updateTypeDto.type }
      });

      if (existingType && existingType.id !== id) {
        throw new ConflictException(`Type "${updateTypeDto.type}" already exists`);
      }
    }

    return this.typeRepository.save(Object.assign(type, updateTypeDto));
  }


  async deleteType(id: number) {
    const type = await this.typeRepository.findOne({
      where: { id }, 
    });
    if (!type) {
      throw new Error(`Type with ID ${id} not found.`);
    }
    await this.typeRepository.remove(type);
  }

}
