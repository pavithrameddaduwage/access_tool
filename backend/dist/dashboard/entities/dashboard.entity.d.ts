import { DashboardType } from "./dashboard-type.entity";
import { DashboardValuetype } from "./dashboard-valuetype.entity";
import { DashboardWorkspace } from "./dashboard-workspace.entity";
import { UserDashboard } from "src/user-dashboard/entities/user-dashboard.entity";
import { Group } from "src/group/entities/group.entity";
export declare class Dashboard {
    id: number;
    dashboard: string;
    userDashboards: UserDashboard[];
    dashboardTypes: DashboardType[];
    dashboardValuetypes: DashboardValuetype[];
    dashboardWorkspaces: DashboardWorkspace[];
    group: Group;
    groupId: number;
}
