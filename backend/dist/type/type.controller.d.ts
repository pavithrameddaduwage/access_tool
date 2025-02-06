import { TypeService } from './type.service';
import { CreateTypeDto } from './dto/create-type.dto';
import { UpdateTypeDto } from './dto/update-type.dto';
export declare class TypeController {
    private readonly typeService;
    constructor(typeService: TypeService);
    getAllTypes(): Promise<import("./entities/type.entity").Type[]>;
    getTypeById(id: number): Promise<import("./entities/type.entity").Type>;
    createType(CreateTypeDto: CreateTypeDto): Promise<CreateTypeDto & import("./entities/type.entity").Type>;
    updateType(id: number, UpdateTypeDto: UpdateTypeDto): Promise<import("./entities/type.entity").Type & UpdateTypeDto>;
    deleteType(id: number): Promise<void>;
}
