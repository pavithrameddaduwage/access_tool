import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UserWebtool } from "./entities/user-webtool.entity";
import { CreateUserWebtoolDto } from "./dto/create-user-webtool.dto";
import { Webtool } from "../webtool/entities/webtool.entity"; // Add this
import { Role } from "../roles/entities/role.entity"; // Add this


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

  async create(createUserWebtoolDto: CreateUserWebtoolDto) {
    console.log('Creating user webtool with data:', createUserWebtoolDto);
  
    const webtool = await this.webtoolRepository.findOne({
      where: { id: createUserWebtoolDto.webtoolId }
    });
  
    if (!webtool) {
      throw new NotFoundException(`Webtool with ID ${createUserWebtoolDto.webtoolId} not found`);
    }
  
    const role = await this.roleRepository.findOne({
      where: { id: createUserWebtoolDto.roleId }
    });
  
    if (!role) {
      throw new NotFoundException(`Role with ID ${createUserWebtoolDto.roleId} not found`);
    }
  
    const userWebtool = this.userWebtoolRepository.create({
      email: createUserWebtoolDto.email,
      userName: createUserWebtoolDto.userName,
      department: createUserWebtoolDto.department,
      webtoolId: createUserWebtoolDto.webtoolId,
      roleId: createUserWebtoolDto.roleId
    });
  
    const saved = await this.userWebtoolRepository.save(userWebtool);
    
    const result = await this.userWebtoolRepository.findOne({
      where: { id: saved.id },
      relations: ['webtool', 'role']
    });
  
    console.log('Created user webtool:', result);
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
          webtools: []
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
}