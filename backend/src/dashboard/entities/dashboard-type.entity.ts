import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Dashboard } from "./dashboard.entity";
import { Type } from "src/type/entities/type.entity";

@Entity()
export class DashboardType {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    typeId: number;

    @ManyToOne(() => Dashboard, dashboard => dashboard.dashboardTypes, {
        onDelete: 'CASCADE'
    })
    @JoinColumn({ name: 'dashboardId' })
    dashboard: Dashboard;

    @ManyToOne(() => Type, type => type.dashboardTypes)
    @JoinColumn({ name: 'typeId' })
    type: Type;
}
