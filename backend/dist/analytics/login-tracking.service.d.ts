import { Repository } from 'typeorm';
import { LoginEvent } from './entities/login-event.entity';
import { Request } from 'express';
export declare class LoginTrackingService {
    private readonly loginEventRepository;
    constructor(loginEventRepository: Repository<LoginEvent>);
    recordLogin(email: string, webtool: string, req: Request, department?: string, location?: string): Promise<LoginEvent>;
}
