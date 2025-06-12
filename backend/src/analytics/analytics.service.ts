// analytics.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { LoginEvent } from './entities/login-event.entity';
import { subDays } from 'date-fns';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(LoginEvent)
    public readonly loginEventRepository: Repository<LoginEvent>,
  ) {}



  async getLoginEvents() {
    return this.loginEventRepository.find({
      order: {
        loginTime: 'DESC'
      }
    });
  }




  async getDailyLogins(days: number = 30, webtool?: string, email?: string) {
  const startDate = subDays(new Date(), days);
  
  const query = this.loginEventRepository.createQueryBuilder('login')
    .select("DATE(login.loginTime)", "date")
    .addSelect('COUNT(*)', 'count')
    .where('login.loginTime >= :startDate', { startDate });

  if (webtool) {
    query.andWhere('login.webtool = :webtool', { webtool });
  }

  if (email) {
    query.andWhere('login.email = :email', { email });
  }

  return query
    .groupBy("DATE(login.loginTime)")
    .orderBy("DATE(login.loginTime)", "ASC")
    .getRawMany();
}
async getLoginsByHour(days: number = 30, webtool?: string, email?: string) {
  const startDate = subDays(new Date(), days);
  
  const query = this.loginEventRepository.createQueryBuilder('login')
    .select('EXTRACT(HOUR FROM login.loginTime)', 'hour')
    .addSelect('COUNT(*)', 'count')
    .where('login.loginTime >= :startDate', { startDate });

  if (webtool) {
    query.andWhere('login.webtool = :webtool', { webtool });
  }

  if (email) {
    query.andWhere('login.email = :email', { email });
  }

  return query
    .groupBy('EXTRACT(HOUR FROM login.loginTime)')
    .orderBy('EXTRACT(HOUR FROM login.loginTime)', 'ASC')
    .getRawMany();
}

async getLoginsByDayOfWeek(days: number = 30, webtool?: string, email?: string) {
  const startDate = subDays(new Date(), days);
  
  const query = this.loginEventRepository.createQueryBuilder('login')
    .select('EXTRACT(DOW FROM login.loginTime)', 'day')
    .addSelect('COUNT(*)', 'count')
    .where('login.loginTime >= :startDate', { startDate });

  if (webtool) {
    query.andWhere('login.webtool = :webtool', { webtool });
  }

  if (email) {
    query.andWhere('login.email = :email', { email });
  }

  return query
    .groupBy('EXTRACT(DOW FROM login.loginTime)')
    .orderBy('EXTRACT(DOW FROM login.loginTime)', 'ASC')
    .getRawMany();
}

async getSummary(days: number = 30, webtool?: string, email?: string) {
  const startDate = subDays(new Date(), days);
  
  const whereClause = {
    loginTime: MoreThanOrEqual(startDate),
    ...(webtool && { webtool }),
    ...(email && { email })
  };

  const [totalLogins, activeUsers] = await Promise.all([
    this.loginEventRepository.count({ where: whereClause }),
    email ? 1 : this.loginEventRepository.createQueryBuilder('login')
      .select('COUNT(DISTINCT login.email)', 'count')
      .where('login.loginTime >= :startDate', { startDate })
      .andWhere(webtool ? 'login.webtool = :webtool' : '1=1', { webtool })
      .getRawOne()
      .then(res => parseInt(res.count, 10))
  ]);

  return {
    totalLogins,
    activeUsers: email ? 1 : activeUsers
  };
}

async getDepartmentLoginStats(days: number = 30, webtool?: string): Promise<{department: string; logins: number}[]> {
  const startDate = subDays(new Date(), days);
  
  const query = this.loginEventRepository.createQueryBuilder('login')
    .select('login.department', 'department')
    .addSelect('COUNT(*)', 'logins')
    .where('login.loginTime >= :startDate', { startDate });

  if (webtool) {
    query.andWhere('login.webtool = :webtool', { webtool });
  }

  return query
    .groupBy('login.department')
    .orderBy('logins', 'DESC')
    .getRawMany();
}

async getDepartmentHourlyLogins(days: number = 30, webtool?: string): Promise<{department: string; hour: number; count: number}[]> {
  const startDate = subDays(new Date(), days);
  
  const query = this.loginEventRepository.createQueryBuilder('login')
    .select('login.department', 'department')
    .addSelect('EXTRACT(HOUR FROM login.loginTime)', 'hour')
    .addSelect('COUNT(*)', 'count')
    .where('login.loginTime >= :startDate', { startDate });

  if (webtool) {
    query.andWhere('login.webtool = :webtool', { webtool });
  }

  return query
    .groupBy('login.department, EXTRACT(HOUR FROM login.loginTime)')
    .orderBy('department, hour')
    .getRawMany();
}

async getDepartmentDailyLogins(days: number = 30, webtool?: string): Promise<{department: string; date: string; count: number}[]> {
  const startDate = subDays(new Date(), days);
  
  const query = this.loginEventRepository.createQueryBuilder('login')
    .select('login.department', 'department')
    .addSelect('DATE(login.loginTime)', 'date')
    .addSelect('COUNT(*)', 'count')
    .where('login.loginTime >= :startDate', { startDate });

  if (webtool) {
    query.andWhere('login.webtool = :webtool', { webtool });
  }

  return query
    .groupBy('login.department, DATE(login.loginTime)')
    .orderBy('department, date')
    .getRawMany();
}
}