import { Dashboard } from "./dashboard.entity";
import { Workspace } from "src/workspace/entities/workspace.entity";
export declare class DashboardWorkspace {
    id: number;
    workspaceId: number;
    dashboard: Dashboard;
    workspace: Workspace;
}
