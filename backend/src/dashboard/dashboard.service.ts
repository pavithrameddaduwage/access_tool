import { ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateDashboardDto } from './dto/create-dashboard.dto';
import { UpdateDashboardDto } from './dto/update-dashboard.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Dashboard } from './entities/dashboard.entity';
import { Repository } from 'typeorm';
import { DashboardType } from './entities/dashboard-type.entity';
import { DashboardValuetype } from './entities/dashboard-valuetype.entity';
import { DashboardWorkspace } from './entities/dashboard-workspace.entity';
import { UserDashboard } from 'src/user-dashboard/entities/user-dashboard.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Dashboard)
    private dashboardRepository: Repository<Dashboard>,
    @InjectRepository(DashboardType)
    private dashboardTypeRepository: Repository<DashboardType>,
    @InjectRepository(DashboardValuetype)
    private dashboardValuetypeRepository: Repository<DashboardValuetype>,
    @InjectRepository(DashboardWorkspace)
    private dashboardWorkspaceRepository: Repository<DashboardWorkspace>,
    @InjectRepository(UserDashboard)
    private userDashboardRepository: Repository<UserDashboard>
  ) {}

  async create(createDashboardDto: CreateDashboardDto) {
    const { typeIds, valueTypeIds, workspaceIds, groupId, ...dashboardData } = createDashboardDto;

    // Check if dashboard with same name already exists
    const existingDashboard = await this.dashboardRepository.findOne({
      where: { dashboard: dashboardData.dashboard }
    });

    if (existingDashboard) {
      throw new ConflictException(`Dashboard "${dashboardData.dashboard}" already exists`);
    }

    try {
      // Create dashboard with group
      const dashboard = this.dashboardRepository.create({
        ...dashboardData,
        groupId: groupId || null
      });
      await this.dashboardRepository.save(dashboard);

      // Create relationships
      await Promise.all([
        ...(typeIds?.map(typeId =>
          this.dashboardTypeRepository.save({
            dashboard: dashboard,
            typeId: typeId
          })
        ) || []),
        ...(valueTypeIds?.map(valueTypeId =>
          this.dashboardValuetypeRepository.save({
            dashboard: dashboard,
            valueTypeId: valueTypeId
          })
        ) || []),
        ...(workspaceIds?.map(workspaceId =>
          this.dashboardWorkspaceRepository.save({
            dashboard: dashboard,
            workspaceId: workspaceId
          })
        ) || [])
      ]);

      return this.findOne(dashboard.id);
    } catch (error) {
      throw new InternalServerErrorException('Failed to create dashboard');
    }
  }
  async findAll() {
    const dashboards = await this.dashboardRepository.find({
      relations: [
        'dashboardTypes.type', 
        'dashboardValuetypes.valuetype',
        'dashboardWorkspaces.workspace',
        'group',
        'userDashboards'
      ]
    });
  
    const dashboardsWithUsers = await Promise.all(dashboards.map(async dashboard => ({
      ...dashboard,
      users: await this.getUsersForDashboard(dashboard.id)
    })));
  
    return dashboardsWithUsers;
  }

  private async getUsersForDashboard(dashboardId: number) {
    const userDashboards = await this.userDashboardRepository.find({
      where: { dashboardId }
    });

    return userDashboards.map(ud => ({
      email: ud.email,
      userName: ud.userName,
      department: ud.department
    }));
  }

  findOne(id: number) {
    return this.dashboardRepository.findOne({
      where: { id },
      relations: [
        'dashboardTypes.type', 
        'dashboardValuetypes.valuetype',
        'dashboardWorkspaces.workspace',
        'group'
      ]
    });
  }

  // async update(id: number, updateDashboardDto: UpdateDashboardDto) {
  //   const dashboard = await this.dashboardRepository.findOne({
  //     where: { id },
  //     relations: ['dashboardTypes', 'dashboardValuetypes', 'dashboardWorkspaces']
  //   });
    
  //   if (!dashboard) {
  //     throw new NotFoundException(`Dashboard with ID ${id} not found`);
  //   }

  //   // Check for duplicate name if name is being updated
  //   if (updateDashboardDto.dashboard && updateDashboardDto.dashboard !== dashboard.dashboard) {
  //     const existingDashboard = await this.dashboardRepository.findOne({
  //       where: { dashboard: updateDashboardDto.dashboard }
  //     });

  //     if (existingDashboard && existingDashboard.id !== id) {
  //       throw new ConflictException(`Dashboard "${updateDashboardDto.dashboard}" already exists`);
  //     }
  //   }

  //   try {
  //     // Update dashboard name and group
  //     if (updateDashboardDto.dashboard || updateDashboardDto.groupId !== undefined) {
  //       Object.assign(dashboard, {
  //         dashboard: updateDashboardDto.dashboard || dashboard.dashboard,
  //         groupId: updateDashboardDto.groupId !== undefined ? updateDashboardDto.groupId : dashboard.groupId
  //       });
  //       await this.dashboardRepository.save(dashboard);
  //     }

  //     // Update relationships
  //     await this.updateRelationships(id, updateDashboardDto);

  //     return this.findOne(id);
  //   } catch (error) {
  //     throw new InternalServerErrorException('Failed to update dashboard');
  //   }
  // }

  // private async updateRelationships(id: number, updateDashboardDto: UpdateDashboardDto) {
  //   const { typeIds, valueTypeIds, workspaceIds } = updateDashboardDto;

  //   if (typeIds?.length > 0) {
  //     await this.dashboardTypeRepository.delete({ dashboard: { id } });
  //     await Promise.all(typeIds.map(typeId => 
  //       this.dashboardTypeRepository.save({
  //         dashboard: { id },
  //         typeId
  //       })
  //     ));
  //   }

  //   if (valueTypeIds?.length > 0) {
  //     await this.dashboardValuetypeRepository.delete({ dashboard: { id } });
  //     await Promise.all(valueTypeIds.map(valueTypeId =>
  //       this.dashboardValuetypeRepository.save({
  //         dashboard: { id },
  //         valueTypeId
  //       })
  //     ));
  //   }

  //   if (workspaceIds?.length > 0) {
  //     await this.dashboardWorkspaceRepository.delete({ dashboard: { id } });
  //     await Promise.all(workspaceIds.map(workspaceId =>
  //       this.dashboardWorkspaceRepository.save({
  //         dashboard: { id },
  //         workspaceId
  //       })
  //     ));
  //   }
  // }
  async update(id: number, updateDashboardDto: UpdateDashboardDto) {
    const dashboard = await this.dashboardRepository.findOne({
      where: { id },
      relations: ['dashboardTypes', 'dashboardValuetypes', 'dashboardWorkspaces']
    });
    
    if (!dashboard) {
      throw new NotFoundException(`Dashboard with ID ${id} not found`);
    }
  
    // Check for duplicate name if name is being updated
    if (updateDashboardDto.dashboard && updateDashboardDto.dashboard !== dashboard.dashboard) {
      const existingDashboard = await this.dashboardRepository.findOne({
        where: { dashboard: updateDashboardDto.dashboard }
      });
  
      if (existingDashboard && existingDashboard.id !== id) {
        throw new ConflictException(`Dashboard "${updateDashboardDto.dashboard}" already exists`);
      }
    }
  
    try {
      // Update dashboard name and group
      if (updateDashboardDto.dashboard || updateDashboardDto.groupId !== undefined) {
        Object.assign(dashboard, {
          dashboard: updateDashboardDto.dashboard || dashboard.dashboard,
          groupId: updateDashboardDto.groupId !== undefined ? updateDashboardDto.groupId : dashboard.groupId
        });
        await this.dashboardRepository.save(dashboard);
      }
  
      // Update relationships
      await this.updateRelationships(id, updateDashboardDto);
  
      return this.findOne(id);
    } catch (error) {
      throw new InternalServerErrorException('Failed to update dashboard');
    }
  }
  
  private async updateRelationships(id: number, updateDashboardDto: UpdateDashboardDto) {
    const { typeIds, valueTypeIds, workspaceIds } = updateDashboardDto;
  
    // Only update relationships if they are provided in the DTO
    if (typeIds !== undefined) {
      await this.dashboardTypeRepository.delete({ dashboard: { id } });
      if (typeIds.length > 0) {
        await Promise.all(typeIds.map(typeId => 
          this.dashboardTypeRepository.save({
            dashboard: { id },
            typeId
          })
        ));
      }
    }
  
    if (valueTypeIds !== undefined) {
      await this.dashboardValuetypeRepository.delete({ dashboard: { id } });
      if (valueTypeIds.length > 0) {
        await Promise.all(valueTypeIds.map(valueTypeId =>
          this.dashboardValuetypeRepository.save({
            dashboard: { id },
            valueTypeId
          })
        ));
      }
    }
  
    if (workspaceIds !== undefined) {
      await this.dashboardWorkspaceRepository.delete({ dashboard: { id } });
      if (workspaceIds.length > 0) {
        await Promise.all(workspaceIds.map(workspaceId =>
          this.dashboardWorkspaceRepository.save({
            dashboard: { id },
            workspaceId
          })
        ));
      }
    }
  }
  async remove(id: number) {
    try {
      await this.userDashboardRepository.delete({ dashboardId: id });
      const result = await this.dashboardRepository.delete(id);
      
      if (result.affected === 0) {
        throw new NotFoundException(`Dashboard with ID ${id} not found`);
      }
      
      return { message: 'Dashboard deleted successfully' };
    } catch (error) {
      console.error('Error deleting dashboard:', error);
      throw new InternalServerErrorException('Failed to delete dashboard');
    }
  }
}