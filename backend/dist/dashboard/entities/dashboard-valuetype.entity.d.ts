import { Dashboard } from "./dashboard.entity";
import { Valuetype } from "src/valuetype/entities/valuetype.entity";
export declare class DashboardValuetype {
    id: number;
    valueTypeId: number;
    dashboard: Dashboard;
    valuetype: Valuetype;
}
