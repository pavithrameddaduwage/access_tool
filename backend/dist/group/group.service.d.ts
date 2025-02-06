import { Repository } from "typeorm";
import { Group } from "./entities/group.entity";
import { CreateGroupDto } from "./dto/create-group.dto";
import { UpdateGroupDto } from "./dto/update-group.dto";
export declare class GroupsService {
    private groupRepository;
    constructor(groupRepository: Repository<Group>);
    create(createGroupDto: CreateGroupDto): Promise<Group>;
    findAll(): Promise<Group[]>;
    findOne(id: number): Promise<Group>;
    update(id: number, updateGroupDto: UpdateGroupDto): Promise<Group>;
    remove(id: number): Promise<void>;
}
