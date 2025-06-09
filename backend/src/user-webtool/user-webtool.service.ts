import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { UserWebtool } from "./entities/user-webtool.entity";
import { CreateUserWebtoolDto } from "./dto/create-user-webtool.dto";
import { Webtool } from "../webtool/entities/webtool.entity"; // Add this
import { Role } from "../roles/entities/role.entity"; // Add this
import { ExternalWebtoolAssignmentDto } from "./dto/external-webtool-assignment.dto";
import { ExternalDeleteAssignmentDto } from "./dto/external-delete-assignment.dto";
import { UpdateUserWebtoolDto } from "./dto/update-user-webtool.dto";


@Injectable()
export class UserWebtoolService {
  constructor(
    @InjectRepository(UserWebtool)
    private userWebtoolRepository: Repository<UserWebtool>,
    @InjectRepository(Webtool)
    private webtoolRepository: Repository<Webtool>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>
  ) {}

  // async create(createUserWebtoolDto: CreateUserWebtoolDto) {
  //   console.log('Creating user webtool with data:', createUserWebtoolDto);
  
  //   const webtool = await this.webtoolRepository.findOne({
  //     where: { id: createUserWebtoolDto.webtoolId }
  //   });
  
  //   if (!webtool) {
  //     throw new NotFoundException(`Webtool with ID ${createUserWebtoolDto.webtoolId} not found`);
  //   }
  
  //   const role = await this.roleRepository.findOne({
  //     where: { id: createUserWebtoolDto.roleId }
  //   });
  
  //   if (!role) {
  //     throw new NotFoundException(`Role with ID ${createUserWebtoolDto.roleId} not found`);
  //   }
  
  //   const userWebtool = this.userWebtoolRepository.create({
  //     email: createUserWebtoolDto.email,
  //     userName: createUserWebtoolDto.userName,
  //     department: createUserWebtoolDto.department,
  //     webtoolId: createUserWebtoolDto.webtoolId,
  //     roleId: createUserWebtoolDto.roleId
  //   });
  
  //   const saved = await this.userWebtoolRepository.save(userWebtool);
    
  //   const result = await this.userWebtoolRepository.findOne({
  //     where: { id: saved.id },
  //     relations: ['webtool', 'role']
  //   });
  
  //   console.log('Created user webtool:', result);
  //   return result;
  // }

  async create(createUserWebtoolDto: CreateUserWebtoolDto) {
    // console.log('Creating user webtool with data:', createUserWebtoolDto);
  
    // 1. Validate webtool exists
    const webtool = await this.webtoolRepository.findOne({
      where: { id: createUserWebtoolDto.webtoolId }
    });
    if (!webtool) {
      throw new NotFoundException(`Webtool with ID ${createUserWebtoolDto.webtoolId} not found`);
    }

    // 2. Validate role exists
    const role = await this.roleRepository.findOne({
      where: { id: createUserWebtoolDto.roleId }
    });
    if (!role) {
      throw new NotFoundException(`Role with ID ${createUserWebtoolDto.roleId} not found`);
    }

    // 3. Create entity with PROPER status handling
    const userWebtool = this  .userWebtoolRepository.create({
      email: createUserWebtoolDto.email,
      userName: createUserWebtoolDto.userName,
      department: createUserWebtoolDto.department,
      webtoolId: createUserWebtoolDto.webtoolId,
      roleId: createUserWebtoolDto.roleId,
      isActive: createUserWebtoolDto.isActive,  // Use the value from DTO without default
      lastActiveAt: createUserWebtoolDto.isActive === false ? new Date() : null  // Set timestamp only when inactivating
    });

    // 4. Save and return with relations
    const saved = await this.userWebtoolRepository.save(userWebtool);
    
    // 5. Verify the created entity
    const result = await this.userWebtoolRepository.findOne({
      where: { id: saved.id },
      relations: ['webtool', 'role']
    });

  //   console.log('Created user webtool with status:', { 
  //     isActive: result.isActive, 
  //     lastActiveAt: result.lastActiveAt 
  // });
    return result;
}
  async removeRole(email: string, webtoolId: number, roleId: number) {
    const result = await this.userWebtoolRepository.delete({
      email,
      webtoolId,
      roleId
    });

    if (result.affected === 0) {
      throw new NotFoundException(
        `User-Webtool-Role relationship not found for email=${email}, webtoolId=${webtoolId}, roleId=${roleId}`
      );
    }
  }
  async getUserWebtoolsByUser(email: string): Promise<UserWebtool[]> {
    return this.userWebtoolRepository.find({
      where: { email },
      relations: ['webtool', 'role']
    });
  }
  async findAll() {
    const userWebtools = await this.userWebtoolRepository.find({
      relations: ['webtool', 'role']
    });
  
    const userMap = new Map();
  
    for (const uw of userWebtools) {
      if (!userMap.has(uw.email)) {
        userMap.set(uw.email, {
          userId: uw.id,
          userName: uw.userName,
          email: uw.email,
          department: uw.department,
          roles: {},
          webtools: [],
          isActive: uw.isActive,
          lastActiveAt: uw.lastActiveAt  
        });
      }
  
      const userData = userMap.get(uw.email);
  
      if (uw.webtool?.webtool && !userData.webtools.includes(uw.webtool.webtool)) {
        userData.webtools.push(uw.webtool.webtool);
      }
  
      if (uw.webtool?.id && uw.role) {
        if (!userData.roles[uw.webtool.id]) {
          userData.roles[uw.webtool.id] = [];
        }
  
        const roleExists = userData.roles[uw.webtool.id].some(r => r.id === uw.role.id);
        if (!roleExists) {
          userData.roles[uw.webtool.id].push({
            id: uw.role.id,
            name: uw.role.roles,
            privileges: uw.role.privileges
          });
        }
      }
    }
  
    return Array.from(userMap.values());
  }
  findOne(id: number) {
    return this.userWebtoolRepository.findOne({
      where: { id },
      relations: ['webtool', 'role']
    });
  }

  async remove(email: string, webtoolId: number) {
    await this.userWebtoolRepository.delete({ email, webtoolId });
  }




  // Only for external webtool use
  // async createExternalAssignment(dto: ExternalWebtoolAssignmentDto) {
  //   // Validate webtool exists
  //   const webtool = await this.webtoolRepository.findOne({
  //     where: { id: dto.webtoolId }
  //   });

  //   if (!webtool) {
  //     throw new NotFoundException(`Webtool with ID ${dto.webtoolId} not found`);
  //   }

  //   // Validate roles exist and belong to the webtool
  //   const roles = await this.roleRepository.find({
  //     where: { 
  //       id: In(dto.roleIds),
  //       webtool: { id: dto.webtoolId } // Changed this line to use the relation
  //     },
  //     relations: ['webtool'] // Add this to load the webtool relation
  //   });

  //   if (roles.length !== dto.roleIds.length) {
  //     throw new NotFoundException('Some roles were not found or do not belong to this webtool');
  //   }

  //   // Delete existing assignments for this user-webtool combination
  //   await this.userWebtoolRepository.delete({
  //     email: dto.email,
  //     webtoolId: dto.webtoolId
  //   });

  //   // Create new assignments
  //   const userWebtools = dto.roleIds.map(roleId => 
  //     this.userWebtoolRepository.create({
  //       email: dto.email,
  //       userName: dto.userName,
  //       department: dto.department,
  //       webtoolId: dto.webtoolId,
  //       roleId: roleId
  //     })
  //   );

  //   const saved = await this.userWebtoolRepository.save(userWebtools);

  //   return {
  //     success: true,
  //     message: 'User assignments created successfully',
  //     data: {
  //       email: dto.email,
  //       userName: dto.userName,
  //       webtool: webtool.webtool,
  //       roles: roles.map(role => ({
  //         id: role.id,
  //         name: role.roles
  //       }))
  //     }
  //   };
  // }


  // new recent one
  
  // async createExternalAssignment(dto: ExternalWebtoolAssignmentDto) {
  //   // Validate webtool exists
  //   const webtool = await this.webtoolRepository.findOne({
  //     where: { id: dto.webtoolId }
  //   });
  
  //   if (!webtool) {
  //     throw new NotFoundException(`Webtool with ID ${dto.webtoolId} not found`);
  //   }
  
  //   // Validate roles exist and belong to the webtool
  //   const roles = await this.roleRepository.find({
  //     where: { 
  //       id: In(dto.roleIds),
  //       webtool: { id: dto.webtoolId }
  //     },
  //     relations: ['webtool']
  //   });
  
  //   if (roles.length !== dto.roleIds.length) {
  //     throw new NotFoundException('Some roles were not found or do not belong to this webtool');
  //   }
  
  //   // Delete existing assignments for this user-webtool combination
  //   await this.userWebtoolRepository.delete({
  //     email: dto.email,
  //     webtoolId: dto.webtoolId
  //   });
  
  //   // Create new assignments with isActive=true by default
  //   const userWebtools = dto.roleIds.map(roleId => 
  //     this.userWebtoolRepository.create({
  //       email: dto.email,
  //       userName: dto.userName,
  //       department: dto.department,
  //       webtoolId: dto.webtoolId,
  //       roleId: roleId,
  //       isActive: true, // Always active for external assignments
  //       lastActiveAt: new Date() // Set current timestamp
  //     })
  //   );
  
  //   const saved = await this.userWebtoolRepository.save(userWebtools);
  
  //   return {
  //     success: true,
  //     message: 'User assignments created successfully',
  //     data: {
  //       email: dto.email,
  //       userName: dto.userName,
  //       webtool: webtool.webtool,
  //       roles: roles.map(role => ({
  //         id: role.id,
  //         name: role.roles
  //       })),
  //       isActive: true // Explicitly showing active status in response
  //     }
  //   };
  // }
  async createExternalAssignment(dto: ExternalWebtoolAssignmentDto) {
    // Validate webtool exists
    const webtool = await this.webtoolRepository.findOne({
      where: { id: dto.webtoolId }
    });
  
    if (!webtool) {
      throw new NotFoundException(`Webtool with ID ${dto.webtoolId} not found`);
    }
  
    // Validate roles exist and belong to the webtool
    const roles = await this.roleRepository.find({
      where: { 
        id: In(dto.roleIds),
        webtool: { id: dto.webtoolId }
      },
      relations: ['webtool']
    });
  
    if (roles.length !== dto.roleIds.length) {
      throw new NotFoundException('Some roles were not found or do not belong to this webtool');
    }
  
    // Delete existing assignments for this user-webtool combination
    await this.userWebtoolRepository.delete({
      email: dto.email,
      webtoolId: dto.webtoolId
    });
  
    // Determine the active status (default to true if not provided)
    const isActive = dto.isActive !== undefined ? dto.isActive : true;
    const lastActiveAt = isActive ? null : new Date();
  
    // Create new assignments with proper active status
    const userWebtools = dto.roleIds.map(roleId => 
      this.userWebtoolRepository.create({
        email: dto.email,
        userName: dto.userName,
        department: dto.department,
        webtoolId: dto.webtoolId,
        roleId: roleId,
        isActive: isActive,
        lastActiveAt: lastActiveAt
      })
    );
  
    const saved = await this.userWebtoolRepository.save(userWebtools);
  
    return {
      success: true,
      message: 'User assignments created successfully',
      data: {
        email: dto.email,
        userName: dto.userName,
        webtool: webtool.webtool,
        roles: roles.map(role => ({
          id: role.id,
          name: role.roles
        })),
        isActive: isActive,
        lastActiveAt: lastActiveAt
      }
    };
  }
  async deleteExternalAssignment(dto: ExternalDeleteAssignmentDto) {
    // Delete all role assignments for this user in this webtool
    await this.userWebtoolRepository.delete({
      email: dto.email,
      webtoolId: dto.webtoolId
    });
  
    return {
      success: true,
      message: 'User assignments deleted successfully',
      data: {
        email: dto.email,
        webtoolId: dto.webtoolId
      }
    };
  }

  async updateActiveStatus(email: string, webtoolId: number, isActive: boolean): Promise<void> {
    await this.userWebtoolRepository.update(
      { email, webtoolId },
      { 
        isActive,
        lastActiveAt: isActive ? null : new Date() 
      }
    );
  }
  
  async update(id: number, updateDto: UpdateUserWebtoolDto) {
    const updateData: any = { ...updateDto };
    
    // Add this to ensure proper date handling
    if (updateDto.isActive !== undefined) {
      updateData.lastActiveAt = updateDto.isActive ? 
        null : new Date().toISOString(); // Use ISO string format
    }
  
    await this.userWebtoolRepository.update(id, updateData);
    return this.userWebtoolRepository.findOne({ 
      where: { id },
      relations: ['webtool', 'role'] 
    });
  }

  async findAllRaw() {
    return this.userWebtoolRepository.find({
      where: { isActive: true }, // Only active users
      relations: ['webtool', 'role']
    });
  }


  
  
}

