import { CreateWebtoolDto } from './dto/create-webtool.dto';
import { UpdateWebtoolDto } from './dto/update-webtool.dto';
import { Webtool } from './entities/webtool.entity';
import { Repository } from 'typeorm';
export declare class WebtoolService {
    private readonly webtoolRepository;
    constructor(webtoolRepository: Repository<Webtool>);
    createWebtool(createWebtoolDto: CreateWebtoolDto): Promise<CreateWebtoolDto & Webtool>;
    getAllWebtool(): Promise<Webtool[]>;
    getWebtoolById(id: number): Promise<Webtool>;
    updateWebtool(id: number, updateWebtoolDto: UpdateWebtoolDto): Promise<Webtool & UpdateWebtoolDto>;
    deleteWebtool(id: number): Promise<void>;
}
