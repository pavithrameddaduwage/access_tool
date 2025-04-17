// user-dashboard.service.ts
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserDashboard } from './entities/user-dashboard.entity';
import { CreateUserDashboardDto } from './dto/create-user-dashboard.dto';
import { UpdateUserDashboardDto } from './dto/update-user-dashboard.dto';
import { Dashboard } from 'src/dashboard/entities/dashboard.entity';
import { UserMetric } from 'src/powerbi-metrics/powerbi-metrics.service';

@Injectable()
export class UserDashboardService {
 constructor(
   @InjectRepository(UserDashboard)
   private userDashboardRepository: Repository<UserDashboard>,
   @InjectRepository(Dashboard)
   private dashboardRepository: Repository<Dashboard>
 ) {}

 // Update findAll() method
async findAll() {
  const results = await this.userDashboardRepository.find({
    relations: ['dashboard']
  });

  const groupedResults = results.reduce((acc, curr) => {
    const { email } = curr;
    if (!acc[email]) {
      acc[email] = {
        userName: curr.userName,
        email: curr.email,
        department: curr.department,
        isActive: curr.isActive,         // Add this
        lastActiveAt: curr.lastActiveAt, // Add this
        dashboards: []
      };
    }
    acc[email].dashboards.push(curr.dashboard.dashboard);
    return acc;
  }, {});

  return Object.values(groupedResults);
}

// Update findOne() method
async findOne(email: string) {
  const assignments = await this.userDashboardRepository.find({
    where: { email },
    relations: ['dashboard']
  });

  if (!assignments.length) {
    throw new NotFoundException(`No dashboard assignments found for user ${email}`);
  }

  return {
    email: assignments[0].email,
    userName: assignments[0].userName,
    department: assignments[0].department,
    isActive: assignments[0].isActive,      // Add this
    lastActiveAt: assignments[0].lastActiveAt, // Add this
    dashboards: assignments.map(a => a.dashboard.dashboard)
  };
}

 async create(createUserDashboardDto: CreateUserDashboardDto) {
  const { email } = createUserDashboardDto;

  // Check if user already exists
  const existingUser = await this.userDashboardRepository.findOne({
    where: { email }
  });

  if (existingUser) {
    throw new ConflictException('User with this email already exists');
  }

  // Rest of your create logic...
  const { userName, department, dashboardIds } = createUserDashboardDto;
  const userDashboards = await Promise.all(dashboardIds.map(async dashboardId => {
    return this.userDashboardRepository.create({
      email,
      userName,
      department,
      dashboardId
    });
  }));

  await this.userDashboardRepository.save(userDashboards);
  return this.findOne(email);
}

//  // user-dashboard.service.ts
// async findAll() {
//   const results = await this.userDashboardRepository.find({
//     relations: ['dashboard']
//   });

//   // Group by email and include all user details
//   const groupedResults = results.reduce((acc, curr) => {
//     const { email } = curr;
//     if (!acc[email]) {
//       acc[email] = {
//         userName: curr.userName,
//         email: curr.email,
//         department: curr.department,
//         dashboards: []
//       };
//     }
//     acc[email].dashboards.push(curr.dashboard.dashboard);
//     return acc;
//   }, {});

//   return Object.values(groupedResults);
// }

//  async findOne(email: string) {
//    const assignments = await this.userDashboardRepository.find({
//      where: { email },
//      relations: ['dashboard']
//    });
 
//    if (!assignments.length) {
//      throw new NotFoundException(`No dashboard assignments found for user ${email}`);
//    }
 
//    return {
//      email: assignments[0].email,
//      dashboards: assignments.map(a => a.dashboard.dashboard)
//    };
//  }

//  async update(email: string, updateUserDashboardDto: UpdateUserDashboardDto) {
//   const { dashboardIds, userName, department } = updateUserDashboardDto;

//   // Delete existing assignments
//   await this.userDashboardRepository.delete({ email });

//   if (dashboardIds && dashboardIds.length > 0) {
//     const userDashboards = dashboardIds.map(dashboardId => {
//       return this.userDashboardRepository.create({
//         email,
//         userName,
//         department,
//         dashboardId
//       });
//     });

//     await this.userDashboardRepository.save(userDashboards);
//   }

//   return this.findOne(email);
// }

async update(email: string, updateUserDashboardDto: UpdateUserDashboardDto) {
  const { dashboardIds, userName, department, isActive } = updateUserDashboardDto;

  // Delete existing assignments
  await this.userDashboardRepository.delete({ email });

  if (dashboardIds && dashboardIds.length > 0) {
    const userDashboards = dashboardIds.map(dashboardId => {
      return this.userDashboardRepository.create({
        email,
        userName,
        department,
        dashboardId,
        isActive: isActive ?? true, // Default to true if not specified
        ...(isActive === false && { lastActiveAt: new Date() }) // Set deactivation timestamp
      });
    });

    await this.userDashboardRepository.save(userDashboards);
  }

  return this.findOne(email);
}
 async remove(email: string) {
   await this.userDashboardRepository.delete({ email });
 }

 async getDatabaseUsers(): Promise<UserMetric[]> {
   const activeUsers = await this.userDashboardRepository
     .createQueryBuilder('user')
     .select(['MIN(user.id) as id', 'user.email']) 
     .where('user.isActive = true')
     .andWhere('user.email IS NOT NULL')
     .groupBy('user.email')
     .getRawMany();
 
   
 
   return activeUsers
   
 }
}