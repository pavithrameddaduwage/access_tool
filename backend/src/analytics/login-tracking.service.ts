// src/analytics/login-tracking.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoginEvent } from './entities/login-event.entity';
import { Request } from 'express';

@Injectable()
export class LoginTrackingService {
  constructor(
    @InjectRepository(LoginEvent)
    private readonly loginEventRepository: Repository<LoginEvent>,
  ) {}

  async recordLogin(
    email: string,
    webtool: string,
    req: Request,
    department?: string,
    location?: string,
  ): Promise<LoginEvent> {
    const timezone = req.headers['timezone']?.toString() || 'UTC';
    
    const loginEvent = this.loginEventRepository.create({
      email,
      webtool,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      department,
      location,
      timezone,
      loginTime: new Date() 
    });
  
    return this.loginEventRepository.save(loginEvent);
  }
}