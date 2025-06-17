// analytics.service.ts
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, ILike } from 'typeorm';
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



  async getUserStats(email: string, webtool?: string, days: number = 30) {
    const normalizedEmail = email.toLowerCase().trim();
    
    try {
      const [totalLogins, dailyLogins, loginsByHour, loginsByDay, webtoolUsage, lastLogin, peakHourData] = await Promise.all([
        this.loginEventRepository.count({ 
          where: { 
            email: ILike(normalizedEmail),
            ...(webtool && { webtool })
          } 
        }),
        this.getDailyLogins(days, webtool, normalizedEmail),
        this.getLoginsByHour(days, webtool, normalizedEmail),
        this.getLoginsByDayOfWeek(days, webtool, normalizedEmail),
        this.loginEventRepository
          .createQueryBuilder('login')
          .select('login.webtool', 'webtool')
          .addSelect('COUNT(*)', 'count')
          .where('LOWER(login.email) = LOWER(:email)', { email: normalizedEmail })
          .andWhere(webtool ? 'login.webtool = :webtool' : '1=1', { webtool })
          .groupBy('login.webtool')
          .orderBy('count', 'DESC')
          .getRawMany(),
        this.loginEventRepository.findOne({
          where: { 
            email: ILike(normalizedEmail),
            ...(webtool && { webtool })
          },
          order: { loginTime: 'DESC' }
        }),
        this.loginEventRepository
          .createQueryBuilder('login')
          .select('EXTRACT(HOUR FROM login.loginTime)', 'hour')
          .addSelect('COUNT(*)', 'count')
          .where('LOWER(login.email) = LOWER(:email)', { email: normalizedEmail })
          .andWhere(webtool ? 'login.webtool = :webtool' : '1=1', { webtool })
          .groupBy('EXTRACT(HOUR FROM login.loginTime)')
          .orderBy('count', 'DESC')
          .limit(1)
          .getRawOne()
      ]);

      return {
        username: normalizedEmail.split('@')[0],
        email: normalizedEmail,
        department: lastLogin?.department || 'Unknown',
        totalLogins,
        mostUsedWebtool: webtoolUsage[0]?.webtool || 'N/A',
        lastLogin: lastLogin?.loginTime || null,
        peakHour: peakHourData ? `${peakHourData.hour}:00` : 'N/A',
        dailyLogins,
        loginsByHour,
        loginsByDay,
        webtoolUsage
      };
    } catch (error) {
      console.error('Error in getUserStats:', error);
      throw new HttpException('Failed to get user stats', HttpStatus.INTERNAL_SERVER_ERROR);
    }
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

// In your AnalyticsService

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
    query.andWhere('LOWER(login.email) = LOWER(:email)', { email }); // Case-insensitive comparison
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
    query.andWhere('LOWER(login.email) = LOWER(:email)', { email }); // Case-insensitive comparison
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
    query.andWhere('LOWER(login.email) = LOWER(:email)', { email }); // Case-insensitive comparison
  }

  return query
    .groupBy('EXTRACT(DOW FROM login.loginTime)')
    .orderBy('EXTRACT(DOW FROM login.loginTime)', 'ASC')
    .getRawMany();
}
}