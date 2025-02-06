import { WebtoolService } from './webtool.service';
import { CreateWebtoolDto } from './dto/create-webtool.dto';
import { UpdateWebtoolDto } from './dto/update-webtool.dto';
export declare class WebtoolController {
    private readonly webtoolService;
    constructor(webtoolService: WebtoolService);
    getAllWebtools(): Promise<import("./entities/webtool.entity").Webtool[]>;
    getWebtoolById(id: number): Promise<import("./entities/webtool.entity").Webtool>;
    createWebtool(createWebtoolDto: CreateWebtoolDto): Promise<CreateWebtoolDto & import("./entities/webtool.entity").Webtool>;
    updateWebtool(id: number, updateWebtoolDto: UpdateWebtoolDto): Promise<import("./entities/webtool.entity").Webtool & UpdateWebtoolDto>;
    deleteWebtool(id: number): Promise<void>;
}
