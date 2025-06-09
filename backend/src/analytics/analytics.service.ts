// src/analytics/analytics.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { LoginEvent } from './entities/login-event.entity';
import { addDays, startOfDay, endOfDay, subDays } from 'date-fns';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(LoginEvent)
    private readonly loginEventRepository: Repository<LoginEvent>,
  ) {}

  // async getDailyLogins(days: number = 30): Promise<{ date: string; count: number }[]> {
  //   const startDate = subDays(new Date(), days);
    
  //   return this.loginEventRepository
  //     .createQueryBuilder('login')
  //     .select("DATE(timezone('UTC', login.loginTime))", "date")
  //     .addSelect('COUNT(*)', 'count')
  //     .where('login.loginTime >= :startDate', { startDate })
  //     .groupBy("DATE(timezone('UTC', login.loginTime))")
  //     .orderBy("DATE(timezone('UTC', login.loginTime))", "ASC")
  //     .getRawMany();
  // }
  async getUserLoginStats(email: string): Promise<{
    totalLogins: number;
    lastLogin: Date;
    loginsLast30Days: number;
  }> {
    const [totalLogins, lastLogin, loginsLast30Days] = await Promise.all([
      this.loginEventRepository.count({ where: { email } }),
      this.loginEventRepository.findOne({
        where: { email },
        order: { loginTime: 'DESC' },
      }),
      this.loginEventRepository.count({
        where: {
          email,
          loginTime: MoreThanOrEqual(subDays(new Date(), 30)),
        },
      }),
    ]);

    return {
      totalLogins,
      lastLogin: lastLogin?.loginTime || null,
      loginsLast30Days,
    };
  }





// async getSummary(days: number = 30): Promise<any> {
//   const [totalLogins, loginsByWebtool, dailyLogins, departmentUsage, activeUsers] = await Promise.all([
//     this.getTotalLogins(days),
//     this.getLoginsByWebtool(days),
//     this.getDailyLogins(days),
//     this.getDepartmentUsage(days),
//     this.getActiveUsers(days)
//   ]);

//   return {
//     totalLogins,
//     loginsByWebtool,
//     dailyLogins,
//     departmentUsage,
//     activeUsers
//   };
// }

// async getTotalLogins(days: number = 30): Promise<number> {
//   const startDate = subDays(new Date(), days);
//   return this.loginEventRepository.count({
//     where: {
//       loginTime: MoreThanOrEqual(startDate)
//     }
//   });
// }

// async getLoginsByWebtool(days: number = 30): Promise<{ webtool: string; count: number }[]> {
//   const startDate = subDays(new Date(), days);
//   return this.loginEventRepository
//     .createQueryBuilder('login')
//     .select('login.webtool', 'webtool')
//     .addSelect('COUNT(*)', 'count')
//     .where('login.loginTime >= :startDate', { startDate })
//     .groupBy('login.webtool')
//     .getRawMany();
// }

// async getDepartmentUsage(days: number = 30): Promise<{ department: string; count: number }[]> {
//   const startDate = subDays(new Date(), days);
//   return this.loginEventRepository
//     .createQueryBuilder('login')
//     .select('login.department', 'department')
//     .addSelect('COUNT(*)', 'count')
//     .where('login.loginTime >= :startDate', { startDate })
//     .groupBy('login.department')
//     .getRawMany();
// }

// async getActiveUsers(days: number = 30): Promise<number> {
//   const startDate = subDays(new Date(), days);
//   const result = await this.loginEventRepository
//     .createQueryBuilder('login')
//     .select('COUNT(DISTINCT login.email)', 'count')
//     .where('login.loginTime >= :date', { date: startDate })
//     .getRawOne();

//   return parseInt(result.count, 10);
// }
// async getLoginsByHour(targetTimezone: string = 'America/New_York', webtool?: string): Promise<{ hour: number; count: number }[]> {
//   const query = this.loginEventRepository
//     .createQueryBuilder('login')
//     .select(`EXTRACT(HOUR FROM timezone(:tz, login.loginTime))`, "hour")
//     .addSelect('COUNT(*)', 'count')
//     .setParameter('tz', targetTimezone);

//   if (webtool) {
//     query.andWhere('login.webtool = :webtool', { webtool });
//   }

//   return query
//     .groupBy(`EXTRACT(HOUR FROM timezone(:tz, login.loginTime))`)
//     .orderBy(`EXTRACT(HOUR FROM timezone(:tz, login.loginTime))`, "ASC")
//     .getRawMany();
// }

// async getLoginsByDayOfWeek(targetTimezone: string = 'America/New_York', webtool?: string): Promise<{ day: number; count: number }[]> {
//   const query = this.loginEventRepository
//     .createQueryBuilder('login')
//     .select(`EXTRACT(DOW FROM timezone(:tz, login.loginTime))`, "day")
//     .addSelect('COUNT(*)', 'count')
//     .setParameter('tz', targetTimezone);

//   if (webtool) {
//     query.andWhere('login.webtool = :webtool', { webtool });
//   }

//   return query
//     .groupBy(`EXTRACT(DOW FROM timezone(:tz, login.loginTime))`)
//     .orderBy(`EXTRACT(DOW FROM timezone(:tz, login.loginTime))`, "ASC")
//     .getRawMany();
// }
// async getSummary(days: number = 30, webtool?: string): Promise<any> {
//   const [totalLogins, loginsByWebtool, dailyLogins, departmentUsage, activeUsers] = await Promise.all([
//     this.getTotalLogins(days, webtool),
//     this.getLoginsByWebtool(days, webtool),
//     this.getDailyLogins(days, webtool),
//     this.getDepartmentUsage(days, webtool),
//     this.getActiveUsers(days, webtool)
//   ]);

//   return {
//     totalLogins,
//     loginsByWebtool,
//     dailyLogins,
//     departmentUsage,
//     activeUsers
//   };
// }

async getDepartmentUsage(days: number = 30, webtool?: string): Promise<{ department: string; count: number }[]> {
  const startDate = subDays(new Date(), days);
  const query = this.loginEventRepository
    .createQueryBuilder('login')
    .select('login.department', 'department')
    .addSelect('COUNT(*)', 'count')
    .where('login.loginTime >= :startDate', { startDate });

  if (webtool) {
    query.andWhere('login.webtool = :webtool', { webtool });
  }

  return query
    .groupBy('login.department')
    .getRawMany();
}

async getActiveUsers(days: number = 30, webtool?: string): Promise<number> {
  const startDate = subDays(new Date(), days);
  const query = this.loginEventRepository
    .createQueryBuilder('login')
    .select('COUNT(DISTINCT login.email)', 'count')
    .where('login.loginTime >= :date', { date: startDate });

  if (webtool) {
    query.andWhere('login.webtool = :webtool', { webtool });
  }

  const result = await query.getRawOne();
  return parseInt(result.count, 10);
}
async getTotalLogins(days: number = 30, webtool?: string): Promise<number> {
  const startDate = subDays(new Date(), days);
  const where: any = {
    loginTime: MoreThanOrEqual(startDate)
  };
  
  if (webtool) {
    where.webtool = webtool;
  }
  
  return this.loginEventRepository.count({ where });
}

async getLoginsByWebtool(days: number = 30, webtool?: string): Promise<{ webtool: string; count: number }[]> {
  const startDate = subDays(new Date(), days);
  const query = this.loginEventRepository
    .createQueryBuilder('login')
    .select('login.webtool', 'webtool')
    .addSelect('COUNT(*)', 'count')
    .where('login.loginTime >= :startDate', { startDate });
    
  if (webtool) {
    query.andWhere('login.webtool = :webtool', { webtool });
  }
  
  return query
    .groupBy('login.webtool')
    .getRawMany();
}

// async getDailyLogins(days: number = 30, webtool?: string): Promise<{ date: string; count: number }[]> {
//   const startDate = subDays(new Date(), days);
//   const query = this.loginEventRepository
//     .createQueryBuilder('login')
//     .select("DATE(timezone('UTC', login.loginTime))", "date")
//     .addSelect('COUNT(*)', 'count')
//     .where('login.loginTime >= :startDate', { startDate });
    
//   if (webtool) {
//     query.andWhere('login.webtool = :webtool', { webtool });
//   }
  
//   return query
//     .groupBy("DATE(timezone('UTC', login.loginTime))")
//     .orderBy("DATE(timezone('UTC', login.loginTime))", "ASC")
//     .getRawMany();
// }


async getLoginsByDayOfWeek(targetTimezone: string = 'America/New_York', webtool?: string, days?: number): Promise<{ day: number; count: number }[]> {
  const query = this.loginEventRepository
    .createQueryBuilder('login')
    .select(`EXTRACT(DOW FROM timezone(:tz, login.loginTime))`, "day")
    .addSelect('COUNT(*)', 'count')
    .setParameter('tz', targetTimezone);

  if (webtool) {
    query.andWhere('login.webtool = :webtool', { webtool });
  }
  
  if (days) {
    const startDate = subDays(new Date(), days);
    query.andWhere('login.loginTime >= :startDate', { startDate });
  }

  return query
    .groupBy(`EXTRACT(DOW FROM timezone(:tz, login.loginTime))`)
    .orderBy(`EXTRACT(DOW FROM timezone(:tz, login.loginTime))`, "ASC")
    .getRawMany();
}

async getDailyLogins(days: number = 30, webtool?: string): Promise<{ date: string; count: number }[]> {
  const startDate = subDays(new Date(), days);
  const query = this.loginEventRepository
    .createQueryBuilder('login')
    .select("DATE(timezone('UTC', login.loginTime))", "date")
    .addSelect('COUNT(*)', 'count')
    .where('login.loginTime >= :startDate', { startDate });

  if (webtool) {
    query.andWhere('login.webtool = :webtool', { webtool });
  }

  return query
    .groupBy("DATE(timezone('UTC', login.loginTime))")
    .orderBy("DATE(timezone('UTC', login.loginTime))", "ASC")
    .getRawMany();
}

async getSummary(days: number = 30, webtool?: string): Promise<any> {
  const startDate = subDays(new Date(), days);
  
  const queryConditions: any = {
    loginTime: MoreThanOrEqual(startDate)
  };
  
  if (webtool) {
    queryConditions.webtool = webtool;
  }

  const [totalLogins, activeUsers] = await Promise.all([
    this.loginEventRepository.count({ where: queryConditions }),
    this.loginEventRepository.createQueryBuilder('login')
      .select('COUNT(DISTINCT login.email)', 'count')
      .where(queryConditions)
      .getRawOne()
      .then(result => parseInt(result.count, 10))
  ]);

  return {
    totalLogins,
    activeUsers
  };
}


async getLoginsByHour(targetTimezone: string = 'America/New_York', webtool?: string, days?: number): Promise<{ hour: number; count: number }[]> {
  const query = this.loginEventRepository
    .createQueryBuilder('login')
    .select(`EXTRACT(HOUR FROM timezone(:tz, login.loginTime))`, "hour")
    .addSelect('COUNT(*)', 'count')
    .setParameter('tz', targetTimezone);

  if (webtool) {
    query.andWhere('login.webtool = :webtool', { webtool });
    
    // First check if any records exist for this webtool
    const exists = await this.loginEventRepository.exist({ 
      where: { webtool } 
    });
    if (!exists) {
      return []; // Return empty array if no records exist
    }
  }
  
  if (days) {
    const startDate = subDays(new Date(), days);
    query.andWhere('login.loginTime >= :startDate', { startDate });
  }

  return query
    .groupBy(`EXTRACT(HOUR FROM timezone(:tz, login.loginTime))`)
    .orderBy(`EXTRACT(HOUR FROM timezone(:tz, login.loginTime))`, "ASC")
    .getRawMany();
}
}