import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Role } from './entities/role.entity';
import { Repository } from 'typeorm';
import { Webtool } from 'src/webtool/entities/webtool.entity';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role) private readonly roleRepository: Repository<Role>,
    @InjectRepository(Webtool) private readonly webtoolRepository: Repository<Webtool>, 
  ) {}


  async getRolesByWebtool(webtoolId: number) {
    return this.roleRepository.find({
      where: {
        webtool: { id: webtoolId }
      },
      relations: ['webtool'],
      order: { roles: 'ASC' }
    });
  }

  
  
  async createRole(createRoleDto: CreateRoleDto): Promise<Role> {
    const { roles, privileges, webtoolId } = createRoleDto;

    // Check if webtool exists
    const webtool = await this.webtoolRepository.findOne({ where: { id: webtoolId } });
    if (!webtool) {
      throw new NotFoundException(`Webtool with ID ${webtoolId} not found`);
    }

    // Check if role name already exists for this webtool
    const existingRole = await this.roleRepository.findOne({
      where: {
        roles: roles,
        webtool: { id: webtoolId }
      },
      relations: ['webtool']
    });

    if (existingRole) {
      throw new ConflictException(`Role "${roles}" already exists for Web Tool "${webtool.webtool}"`);
    }

    const role = this.roleRepository.create({
      roles,
      privileges,
      webtool,
    });

    return this.roleRepository.save(role);
  }

      async getAllRoles() {
      return this.roleRepository.find(
        { relations: ['webtool'],order: {'roles':'ASC'}});
    }
  
  
    async getRoleById(id: number) {
      const role = await this.roleRepository.findOne({
        where: { id },
        relations: ['webtool']
      });
  
      if (!role) {
        throw new NotFoundException(`Role with ID ${id} not found`);
      }
  
      return role;
    }
  
  
  
  
    async updateRole(id: number, updateRoleDto: UpdateRoleDto) {
      const existingRole = await this.roleRepository.findOne({
        where: { id },
        relations: ['webtool']
      });
  
      if (!existingRole) {
        throw new NotFoundException(`Role with ID ${id} not found`);
      }
  
      // Check for duplicate role names in the same webtool
      if (updateRoleDto.roles && updateRoleDto.roles !== existingRole.roles) {
        const duplicateRole = await this.roleRepository.findOne({
          where: {
            roles: updateRoleDto.roles,
            webtool: { id: updateRoleDto.webtoolId || existingRole.webtool.id }
          },
          relations: ['webtool']
        });
  
        if (duplicateRole && duplicateRole.id !== id) {
          const webtool = duplicateRole.webtool.webtool;
          throw new ConflictException(`Role "${updateRoleDto.roles}" already exists for Web Tool "${webtool}"`);
        }
      }
  
      // If webtoolId is being updated, verify the new webtool exists
      if (updateRoleDto.webtoolId && updateRoleDto.webtoolId !== existingRole.webtool.id) {
        const newWebtool = await this.webtoolRepository.findOne({ 
          where: { id: updateRoleDto.webtoolId } 
        });
        
        if (!newWebtool) {
          throw new NotFoundException(`Webtool with ID ${updateRoleDto.webtoolId} not found`);
        }
      }
  
      Object.assign(existingRole, updateRoleDto);
      if (updateRoleDto.webtoolId) {
        existingRole.webtool = { id: updateRoleDto.webtoolId } as Webtool;
      }
  
      return this.roleRepository.save(existingRole);
    }
  
  
  
    async deleteRole(id: number) {
      const role = await this.roleRepository.findOne({
        where: { id },
        relations: ['webtool']
      });
  
      if (!role) {
        throw new NotFoundException(`Role with ID ${id} not found`);
      }
  
      try {
        await this.roleRepository.remove(role);
      } catch (error) {
        if (error.code === '23503') { // Foreign key violation
          throw new ConflictException('Cannot delete role as it is being used by users');
        }
        throw error;
      }
    }
}
