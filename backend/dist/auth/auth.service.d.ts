import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ADUser } from './interfaces/ad-user.interface';
import { LoginTrackingService } from 'src/analytics/login-tracking.service';
import { Request } from 'express';
export declare class AuthService {
    private usersService;
    private jwtService;
    private loginTrackingService;
    private request;
    constructor(usersService: UsersService, jwtService: JwtService, loginTrackingService: LoginTrackingService, request: Request);
    authenticateuser(username: string, password: string): Promise<boolean>;
    getADUserDetails(username: string): Promise<ADUser>;
    signIn(username: string, pass: string): Promise<any>;
    searchUsers(query: string): Promise<any[]>;
}
