import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Group } from "./entities/group.entity";
import { CreateGroupDto } from "./dto/create-group.dto";
import { UpdateGroupDto } from "./dto/update-group.dto";
import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";


@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Group)
    private groupRepository: Repository<Group>
  ) {}

  async create(createGroupDto: CreateGroupDto): Promise<Group> {
    // Check if group already exists
    const existingGroup = await this.groupRepository.findOne({
      where: { group: createGroupDto.group }
    });

    if (existingGroup) {
      throw new ConflictException(`Group "${createGroupDto.group}" already exists`);
    }

    const group = this.groupRepository.create(createGroupDto);
    return this.groupRepository.save(group);
  }

  async findAll(): Promise<Group[]> {
    return this.groupRepository.find({ order: { group: 'ASC' } });
  }

  async findOne(id: number): Promise<Group> {
    const group = await this.groupRepository.findOne({ where: { id } });
    if (!group) {
      throw new NotFoundException(`Group with ID ${id} not found`);
    }
    return group;
  }

  async update(id: number, updateGroupDto: UpdateGroupDto): Promise<Group> {
    // Check if updated name conflicts with existing group
    if (updateGroupDto.group) {
      const existingGroup = await this.groupRepository.findOne({
        where: { group: updateGroupDto.group }
      });

      if (existingGroup && existingGroup.id !== id) {
        throw new ConflictException(`Group "${updateGroupDto.group}" already exists`);
      }
    }

    const group = await this.findOne(id);
    Object.assign(group, updateGroupDto);
    return this.groupRepository.save(group);
  }

  async remove(id: number): Promise<void> {
    const result = await this.groupRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Group with ID ${id} not found`);
    }
  }
}