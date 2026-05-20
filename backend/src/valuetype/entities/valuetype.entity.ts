import { DashboardValuetype } from "src/dashboard/entities/dashboard-valuetype.entity";
import { Dashboard } from "src/dashboard/entities/dashboard.entity";
import { Column, Entity, OneToMany, PrimaryGeneratedColumn, Unique } from "typeorm";

@Entity()
export class Valuetype {
    @PrimaryGeneratedColumn()
    id: number;
    
    @Column()
    @Unique(['valuetype'])
    valuetype: string;

    @OneToMany(() => DashboardValuetype, dashboardValuetype => dashboardValuetype.valuetype)
    dashboardValuetypes: DashboardValuetype[];
          
          
}
