import { Repository } from 'typeorm';
import { Type } from './entities/type.entity';
import { CreateTypeDto } from './dto/create-type.dto';
import { UpdateTypeDto } from './dto/update-type.dto';
export declare class TypeService {
    private readonly typeRepository;
    constructor(typeRepository: Repository<Type>);
    createType(createTypeDto: CreateTypeDto): Promise<CreateTypeDto & Type>;
    getAllTypes(): Promise<Type[]>;
    getTypeById(id: number): Promise<Type>;
    updateType(id: number, updateTypeDto: UpdateTypeDto): Promise<Type & UpdateTypeDto>;
    deleteType(id: number): Promise<void>;
}
