import { Type } from "src/type/entities/type.entity";
import { Valuetype } from "src/valuetype/entities/valuetype.entity";
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, Unique } from "typeorm";
import { DashboardType } from "./dashboard-type.entity";
import { DashboardValuetype } from "./dashboard-valuetype.entity";
import { DashboardWorkspace } from "./dashboard-workspace.entity";
import { UserDashboard } from "src/user-dashboard/entities/user-dashboard.entity";
import { Group } from "src/group/entities/group.entity";

@Entity()
@Unique(['dashboard'])
export class Dashboard {
    @PrimaryGeneratedColumn()
    id: number;
    
    @Column()
    dashboard: string;

    @OneToMany(() => UserDashboard, userDashboard => userDashboard.dashboard, {
        cascade: true
    })
    userDashboards: UserDashboard[];

    @OneToMany(() => DashboardType, dashboardType => dashboardType.dashboard, {
        cascade: true
    })
    dashboardTypes: DashboardType[];

    @OneToMany(() => DashboardValuetype, dashboardValuetype => dashboardValuetype.dashboard, {
        cascade: true
    })
    dashboardValuetypes: DashboardValuetype[];

    @OneToMany(() => DashboardWorkspace, dashboardWorkspace => dashboardWorkspace.dashboard, {
        cascade: true
    })
    dashboardWorkspaces: DashboardWorkspace[];

    @ManyToOne(() => Group, group => group.dashboards)
    @JoinColumn({ name: 'groupId' })
    group: Group;
  
    @Column({ nullable: true })
    groupId: number;
}