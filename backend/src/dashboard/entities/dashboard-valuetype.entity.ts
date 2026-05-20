import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Dashboard } from "./dashboard.entity";
import { Valuetype } from "src/valuetype/entities/valuetype.entity";

@Entity()
export class DashboardValuetype {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    valueTypeId: number;

    @ManyToOne(() => Dashboard, dashboard => dashboard.dashboardValuetypes, {
        onDelete: 'CASCADE'
    })
    @JoinColumn({ name: 'dashboardId' })
    dashboard: Dashboard;

    @ManyToOne(() => Valuetype, valuetype => valuetype.dashboardValuetypes)
    @JoinColumn({ name: 'valueTypeId' })
    valuetype: Valuetype;
}