import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { RoleMaster } from './entities/role_master.entity';
import { UserRoles } from './entities/user_roles.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(RoleMaster)
    private roleRepository: Repository<RoleMaster>,
    @InjectRepository(UserRoles)
    private userrolesRepository: Repository<UserRoles>
  ) {}

  // async create(createUserDto: CreateUserDto) {
  //   // Check if user with same email already exists
  //   const existingUser = await this.userRepository.findOne({
  //     where: { email: createUserDto.email }
  //   });

  //   if (existingUser) {
  //     throw new ConflictException(`User with email "${createUserDto.email}" already exists`);
  //   }

  //   try {
  //     const newuser = new User();
  //     newuser.email = createUserDto.email;
  //     newuser.name = createUserDto.name;
  //     newuser.is_active = createUserDto.is_active;

  //     const savedUser = await this.userRepository.save(newuser);

  //     if (createUserDto.user_roles?.length > 0) {
  //       // Verify all roles exist
  //       await this.validateRoles(createUserDto.user_roles.map(ur => ur.roleId));

  //       const userRoles = createUserDto.user_roles.map(ur => {
  //         const userRole = new UserRoles();
  //         userRole.user = savedUser;
  //         userRole.role = { id: ur.roleId } as RoleMaster;
  //         return userRole;
  //       });

  //       await this.userrolesRepository.save(userRoles);
  //     }

  //     return this.findUserById(savedUser.id);
  //   } catch (error) {
  //     if (error.code === '23505') { // Unique constraint violation
  //       throw new ConflictException(`User with email "${createUserDto.email}" already exists`);
  //     }
  //     throw error;
  //   }
  // }
  async create(createUserDto: CreateUserDto) {
     // Convert email to lowercase
  createUserDto.email = createUserDto.email.toLowerCase();

  // Check if user with same email already exists
  const existingUser = await this.userRepository.findOne({
    where: { email: createUserDto.email }
  });


    if (existingUser) {
      throw new ConflictException(`User with email "${createUserDto.email}" already exists`);
    }

    try {
      const newuser = new User();
      newuser.email = createUserDto.email;
      newuser.name = createUserDto.name;
      newuser.is_active = createUserDto.is_active;

      const savedUser = await this.userRepository.save(newuser);

      if (createUserDto.user_roles?.length > 0) {
        // Verify all roles exist
        await this.validateRoles(createUserDto.user_roles.map(ur => ur.roleId));

        const userRoles = createUserDto.user_roles.map(ur => {
          const userRole = new UserRoles();
          userRole.user = savedUser;
          userRole.role = { id: ur.roleId } as RoleMaster;
          return userRole;
        });

        await this.userrolesRepository.save(userRoles);
      }

      return this.findUserById(savedUser.id);
    } catch (error) {
      if (error.code === '23505') { // Unique constraint violation
        throw new ConflictException(`User with email "${createUserDto.email}" already exists`);
      }
      throw error;
    }
  }
  private async validateRoles(roleIds: number[]) {
    const roles = await this.roleRepository.findByIds(roleIds);
    const missingRoles = roleIds.filter(id => !roles.find(r => r.id === id));
    
    if (missingRoles.length > 0) {
      throw new NotFoundException(`Roles with IDs ${missingRoles.join(', ')} not found`);
    }
  }
  // async update(id: number, updateUserDto: UpdateUserDto) {
  //   const user = await this.userRepository.findOne({ 
  //     where: { id },
  //     relations: ['user_roles']
  //   });
    
  //   if (!user) {
  //     throw new NotFoundException('User not found');
  //   }

  //   // Check email uniqueness if it's being updated
  //   if (updateUserDto.email && updateUserDto.email !== user.email) {
  //     const existingUser = await this.userRepository.findOne({
  //       where: { email: updateUserDto.email }
  //     });

  //     if (existingUser) {
  //       throw new ConflictException(`User with email "${updateUserDto.email}" already exists`);
  //     }
  //   }

  //   try {
  //     if (updateUserDto.email) user.email = updateUserDto.email;
  //     if (updateUserDto.name) user.name = updateUserDto.name;
  //     if (typeof updateUserDto.is_active === 'boolean') user.is_active = updateUserDto.is_active;

  //     await this.userRepository.save(user);

  //     if (updateUserDto.user_roles) {
  //       // Verify all roles exist
  //       await this.validateRoles(updateUserDto.user_roles.map(ur => ur.roleId));

  //       // Delete existing roles
  //       await this.userrolesRepository.delete({ user: { id } });

  //       // Create new roles
  //       const newUserRoles = updateUserDto.user_roles.map(ur => {
  //         const userRole = new UserRoles();
  //         userRole.user = user;
  //         userRole.role = { id: ur.roleId } as RoleMaster;
  //         return userRole;
  //       });

  //       await this.userrolesRepository.save(newUserRoles);
  //     }

  //     return this.findUserById(id);
  //   } catch (error) {
  //     if (error.code === '23505') {
  //       throw new ConflictException(`User with email "${updateUserDto.email}" already exists`);
  //     }
  //     throw error;
  //   }
  // }
  async update(id: number, updateUserDto: UpdateUserDto) {
      // Convert email to lowercase if it's being updated
  if (updateUserDto.email) {
    updateUserDto.email = updateUserDto.email.toLowerCase();
  }

    const user = await this.userRepository.findOne({ 
      where: { id },
      relations: ['user_roles']
    });
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check email uniqueness if it's being updated
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: updateUserDto.email }
      });

      if (existingUser) {
        throw new ConflictException(`User with email "${updateUserDto.email}" already exists`);
      }
    }

    try {
      if (updateUserDto.email) user.email = updateUserDto.email;
      if (updateUserDto.name) user.name = updateUserDto.name;
      if (typeof updateUserDto.is_active === 'boolean') user.is_active = updateUserDto.is_active;

      await this.userRepository.save(user);

      if (updateUserDto.user_roles) {
        // Verify all roles exist
        await this.validateRoles(updateUserDto.user_roles.map(ur => ur.roleId));

        // Delete existing roles
        await this.userrolesRepository.delete({ user: { id } });

        // Create new roles
        const newUserRoles = updateUserDto.user_roles.map(ur => {
          const userRole = new UserRoles();
          userRole.user = user;
          userRole.role = { id: ur.roleId } as RoleMaster;
          return userRole;
        });

        await this.userrolesRepository.save(newUserRoles);
      }

      return this.findUserById(id);
    } catch (error) {
      if (error.code === '23505') {
        throw new ConflictException(`User with email "${updateUserDto.email}" already exists`);
      }
      throw error;
    }
  }
  //  findAll() {
  //   return this.userRepository.find({ 
  //     relations: ['user_roles.role'] 
  //   });
  // }

  findAll() {
    return this.userRepository.find({ 
      relations: {
        user_roles: {
          role: true
        }
      },
      order: {
        id: 'ASC',
        user_roles: {
          role: {
            id: 'ASC'
          }
        }
      }
    });
  }

  
  findAllRoles() {
    return this.roleRepository.find();
  }

  async findUserById(id: number) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['user_roles', 'user_roles.role']
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }


  // findUserByEmail(email: string) {
  //   return this.userRepository.findOne({ 
  //     where: { email: email, is_active: true }, 
  //     relations: ['user_roles.role'] 
  //   });
  // }

  // users.service.ts
findUserByEmail(email: string) {
  // Add toLowerCase() to make the email search case-insensitive
  return this.userRepository.findOne({ 
    where: { 
      email: email.toLowerCase(), 
      is_active: true 
    }, 
    relations: ['user_roles.role'],
    // Add order by to ensure consistent role order
    order: {
      user_roles: {
        role: {
          id: 'ASC'
        }
      }
    }
  });
}
 
  async seedDummyAdmin(): Promise<User> {
    let adminRole = await this.roleRepository.findOne({ where: { role: 'Admin' } });
    if (!adminRole) {
      adminRole = new RoleMaster();
      adminRole.role = 'Admin';
      adminRole = await this.roleRepository.save(adminRole);
    }

    let adminUser = await this.userRepository.findOne({ 
      where: { email: 'admin@hgusa.com' },
      relations: ['user_roles', 'user_roles.role']
    });
    if (!adminUser) {
      adminUser = new User();
      adminUser.email = 'admin@hgusa.com';
      adminUser.name = 'Admin User';
      adminUser.is_active = true;
      adminUser = await this.userRepository.save(adminUser);

      const userRole = new UserRoles();
      userRole.user = adminUser;
      userRole.role = adminRole;
      await this.userrolesRepository.save(userRole);
    }
    
    return this.findUserByEmail('admin@hgusa.com');
  }

  async remove(id: number) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    await this.userrolesRepository.delete({ user: { id } });
    await this.userRepository.remove(user);
  }
}