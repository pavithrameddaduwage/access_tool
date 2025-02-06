import { Dashboard } from "./dashboard.entity";
import { Type } from "src/type/entities/type.entity";
export declare class DashboardType {
    id: number;
    typeId: number;
    dashboard: Dashboard;
    type: Type;
}
