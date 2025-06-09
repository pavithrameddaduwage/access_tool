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
    private readonly loginEventRepository: Repository<LoginEvent>,
  ) {}


  async getDailyLogins(days: number = 30, webtool?: string): Promise<{ date: string; count: number }[]> {
    console.log(`Getting daily logins for ${days} days, webtool: ${webtool}`);
    const startDate = subDays(new Date(), days);
    
    const query = this.loginEventRepository.createQueryBuilder('login')
      .select("DATE(login.loginTime)", "date")
      .addSelect('COUNT(*)', 'count')
      .where('login.loginTime >= :startDate', { startDate });
  
    if (webtool) {
      console.log(`Filtering by webtool: ${webtool}`);
      query.andWhere('login.webtool = :webtool', { webtool });
    }
  
    const result = await query
      .groupBy("DATE(login.loginTime)")
      .orderBy("DATE(login.loginTime)", "ASC")
      .getRawMany();
  
    console.log(`Daily logins query result:`, result);
    return result;
  }
  
  async getLoginsByHour(webtool?: string): Promise<{ hour: number; count: number }[]> {
    const query = this.loginEventRepository.createQueryBuilder('login')
      .select('EXTRACT(HOUR FROM login.loginTime)', 'hour')
      .addSelect('COUNT(*)', 'count');

    if (webtool) {
      query.where('login.webtool = :webtool', { webtool });
    }

    return query
      .groupBy('EXTRACT(HOUR FROM login.loginTime)')
      .orderBy('EXTRACT(HOUR FROM login.loginTime)', 'ASC')
      .getRawMany();
  }

  async getLoginsByDayOfWeek(webtool?: string): Promise<{ day: number; count: number }[]> {
    const query = this.loginEventRepository.createQueryBuilder('login')
      .select('EXTRACT(DOW FROM login.loginTime)', 'day')
      .addSelect('COUNT(*)', 'count');

    if (webtool) {
      query.where('login.webtool = :webtool', { webtool });
    }

    return query
      .groupBy('EXTRACT(DOW FROM login.loginTime)')
      .orderBy('EXTRACT(DOW FROM login.loginTime)', 'ASC')
      .getRawMany();
  }

  async getSummary(days: number = 30, webtool?: string) {
    const startDate = subDays(new Date(), days);
    
    const [totalLogins, activeUsers] = await Promise.all([
      this.loginEventRepository.count({
        where: {
          loginTime: MoreThanOrEqual(startDate),
          ...(webtool && { webtool })
        }
      }),
      this.loginEventRepository.createQueryBuilder('login')
        .select('COUNT(DISTINCT login.email)', 'count')
        .where('login.loginTime >= :startDate', { startDate })
        .andWhere(webtool ? 'login.webtool = :webtool' : '1=1', { webtool })
        .getRawOne()
        .then(res => parseInt(res.count, 10))
    ]);

    return {
      totalLogins,
      activeUsers
    };
  }
}