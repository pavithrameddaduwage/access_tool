import { CreateValuetypeDto } from './dto/create-valuetype.dto';
import { UpdateValuetypeDto } from './dto/update-valuetype.dto';
import { Valuetype } from './entities/valuetype.entity';
import { Repository } from 'typeorm';
export declare class ValuetypeService {
    private readonly valueTypeRepository;
    constructor(valueTypeRepository: Repository<Valuetype>);
    createValueType(createValuetypeDto: CreateValuetypeDto): Promise<CreateValuetypeDto & Valuetype>;
    getAllValueTypes(): Promise<Valuetype[]>;
    getValueTypeById(id: number): Promise<Valuetype>;
    updateValueType(id: number, updateValuetypeDto: UpdateValuetypeDto): Promise<Valuetype & UpdateValuetypeDto>;
    deleteValueType(id: number): Promise<void>;
}
