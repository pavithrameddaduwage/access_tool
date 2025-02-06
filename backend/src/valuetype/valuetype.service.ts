import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateValuetypeDto } from './dto/create-valuetype.dto';
import { UpdateValuetypeDto } from './dto/update-valuetype.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Valuetype } from './entities/valuetype.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ValuetypeService {

  constructor(
    @InjectRepository(Valuetype)
    private readonly valueTypeRepository: Repository<Valuetype>,
  ) {}
  async createValueType(createValuetypeDto: CreateValuetypeDto) {
    // Check if valuetype already exists
    const existingValueType = await this.valueTypeRepository.findOne({
      where: { valuetype: createValuetypeDto.valuetype }
    });

    if (existingValueType) {
      throw new ConflictException(`Value Type "${createValuetypeDto.valuetype}" already exists`);
    }

    return this.valueTypeRepository.save(createValuetypeDto);
  }


  async getAllValueTypes() {
    return this.valueTypeRepository.find({order: {'valuetype':'ASC'}});
  }


  async getValueTypeById(id: number) {
    const valueType = await this.valueTypeRepository.findOne({
      where: { id },
    });

    if (!valueType) {
      throw new NotFoundException(`Value Type with ID ${id} not found`);
    }

    return valueType;
  }


  async updateValueType(id: number, updateValuetypeDto: UpdateValuetypeDto) {
    const valueType = await this.valueTypeRepository.findOne({
      where: { id },
    });

    if (!valueType) {
      throw new NotFoundException(`Value Type with ID ${id} not found`);
    }

    // Check if updated name conflicts with existing value type
    if (updateValuetypeDto.valuetype) {
      const existingValueType = await this.valueTypeRepository.findOne({
        where: { valuetype: updateValuetypeDto.valuetype }
      });

      if (existingValueType && existingValueType.id !== id) {
        throw new ConflictException(`Value Type "${updateValuetypeDto.valuetype}" already exists`);
      }
    }

    return this.valueTypeRepository.save(Object.assign(valueType, updateValuetypeDto));
  }

  async deleteValueType(id: number) {
    const valuetype = await this.valueTypeRepository.findOne({
      where: { id }, 
    });
    if (!valuetype) {
      throw new Error(`Value Type with ID ${id} not found.`);
    }
    await this.valueTypeRepository.remove(valuetype);
  }

}
