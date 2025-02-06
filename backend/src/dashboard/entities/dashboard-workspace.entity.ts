import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Dashboard } from "./dashboard.entity";
import { Workspace } from "src/workspace/entities/workspace.entity";

@Entity()
export class DashboardWorkspace {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    workspaceId: number;

    @ManyToOne(() => Dashboard, dashboard => dashboard.dashboardWorkspaces, {
        onDelete: 'CASCADE'
    })
    @JoinColumn({ name: 'dashboardId' })
    dashboard: Dashboard;

    @ManyToOne(() => Workspace, workspace => workspace.dashboardWorkspaces)
    @JoinColumn({ name: 'workspaceId' })
    workspace: Workspace;
}