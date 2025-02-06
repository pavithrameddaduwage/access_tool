import { DashboardType } from "src/dashboard/entities/dashboard-type.entity";
import { Dashboard } from "src/dashboard/entities/dashboard.entity";
import { Column, Entity, OneToMany, PrimaryGeneratedColumn, Unique } from "typeorm";

@Entity()
export class Type {

  @PrimaryGeneratedColumn()
  id: number;
  
  @Column()
  @Unique(['type'])
  type: string;

  @OneToMany(() => DashboardType, dashboardType => dashboardType.type)
  dashboardTypes: DashboardType[];
      
      
}
