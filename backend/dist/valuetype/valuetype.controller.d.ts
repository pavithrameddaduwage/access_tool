import { ValuetypeService } from './valuetype.service';
import { CreateValuetypeDto } from './dto/create-valuetype.dto';
import { UpdateValuetypeDto } from './dto/update-valuetype.dto';
export declare class ValuetypeController {
    private readonly valuetypeService;
    constructor(valuetypeService: ValuetypeService);
    getAllValueTypes(): Promise<import("./entities/valuetype.entity").Valuetype[]>;
    getValueTypeById(id: number): Promise<import("./entities/valuetype.entity").Valuetype>;
    createValueType(CreateValuetypeDto: CreateValuetypeDto): Promise<CreateValuetypeDto & import("./entities/valuetype.entity").Valuetype>;
    updateType(id: number, UpdateValuetypeDto: UpdateValuetypeDto): Promise<import("./entities/valuetype.entity").Valuetype & UpdateValuetypeDto>;
    deleteType(id: number): Promise<void>;
}
