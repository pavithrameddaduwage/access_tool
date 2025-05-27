// src/user-dashboard/sync-user-departments.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserDashboard } from './entities/user-dashboard.entity';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class SyncUserDepartmentsService {
  constructor(
    @InjectRepository(UserDashboard)
    private userDashboardRepository: Repository<UserDashboard>,
    private httpService: HttpService,
  ) {}

  url = "http://localhost:3000/auth";

  async syncDepartments() {
    const uniqueEmails = await this.userDashboardRepository
      .createQueryBuilder('user')
      .select('DISTINCT user.email', 'email')
      .where('user.email IS NOT NULL')
      .getRawMany();

    let updatedCount = 0;

    for (const { email } of uniqueEmails) {
      try {
        const adUserResponse = await firstValueFrom(
            this.httpService.post(`${this.url}/searchUsers`, { 
                searchkey: email 
          })
        );

        const adUsers = Array.isArray(adUserResponse.data) ? adUserResponse.data : [];
        const adUser = adUsers.find(u => u.email?.toLowerCase() === email.toLowerCase());

        if (adUser && adUser.department) {
          // Update all records for this user with the new department
          const result = await this.userDashboardRepository
            .createQueryBuilder()
            .update(UserDashboard)
            .set({ department: adUser.department })
            .where('email = :email', { email })
            .andWhere('department != :newDepartment', { 
              newDepartment: adUser.department 
            })
            .execute();

          if (result.affected && result.affected > 0) {
            updatedCount += result.affected;
            console.log(`Updated department for ${email} to ${adUser.department}`);
          }
        }
      } catch (error) {
        console.error(`Error syncing department for ${email}:`, error.message);
      }
    }

    return {
      totalUsersChecked: uniqueEmails.length,
      usersUpdated: updatedCount,
    };
  }
}