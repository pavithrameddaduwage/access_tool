import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateWebtoolUserDto } from './dto/create-webtool-user.dto';
import { UpdateWebtoolUserDto } from './dto/update-webtool-user.dto';
import { UserWebtool } from '../user-webtool/entities/user-webtool.entity';

@Injectable()
export class WebtoolUserService {
  constructor(
    @InjectRepository(UserWebtool)
    private readonly webtoolUserRepository: Repository<UserWebtool>
  ) {}

  async findAll() {
    const userWebtools = await this.webtoolUserRepository.find({
      relations: ['webtool', 'role']
    });
  
    const userMap = new Map();
  
    userWebtools.forEach(uw => {
      if (!userMap.has(uw.email)) {
        userMap.set(uw.email, {
          userId: uw.id,
          userName: uw.userName,
          email: uw.email,
          department: uw.department,
          roles: [],
          webtools: [],
          isActive: uw.isActive,
          lastActiveAt: uw.lastActiveAt
        });
      }
  
      const userData = userMap.get(uw.email);
      
      if (uw.webtool && !userData.webtools.includes(uw.webtool.webtool)) {
        userData.webtools.push(uw.webtool.webtool);
      }
  
      if (uw.role && !userData.roles.some(r => r.id === uw.role.id)) {
        userData.roles.push({
          id: uw.role.id,
          name: uw.role.roles,
          privileges: uw.role.privileges
        });
      }
    });
  
    return Array.from(userMap.values());
  }
  async create(createWebtoolUserDto: CreateWebtoolUserDto) {
    const webtoolUser = this.webtoolUserRepository.create({
      email: createWebtoolUserDto.email,
      userName: createWebtoolUserDto.userName,
      department: createWebtoolUserDto.department,
      webtoolId: createWebtoolUserDto.webtoolId,
      roleId: createWebtoolUserDto.roleIds[0]
    });
    
    const saved = await this.webtoolUserRepository.save(webtoolUser);
    return this.findOne(saved.id); 
  }
  async findOne(id: number) {
    return this.webtoolUserRepository.findOne({
      where: { id },
      relations: ['webtool', 'role']
    });
  }
  async remove(email: string, webtoolId: number): Promise<string> {
    const result = await this.webtoolUserRepository.delete({
      email,
      webtoolId,
    });
  
    if (result.affected === 0) {
      throw new Error(`No user-webtool record found for email: ${email} and webtoolId: ${webtoolId}`);
    }
  
    return `User-webtool relationship for email: ${email} and webtoolId: ${webtoolId} has been removed.`;
  }
  
  
}