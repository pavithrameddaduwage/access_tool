import { DashboardWorkspace } from "src/dashboard/entities/dashboard-workspace.entity";
import { Column, Entity, OneToMany, PrimaryGeneratedColumn, Unique } from "typeorm";

@Entity()
export class Workspace {
   @PrimaryGeneratedColumn()
   id: number;
   
   @Column()
   @Unique(['workspace'])
   workspace: string;

   @OneToMany(() => DashboardWorkspace, dashboardWorkspace => dashboardWorkspace.workspace)
   dashboardWorkspaces: DashboardWorkspace[];
}
