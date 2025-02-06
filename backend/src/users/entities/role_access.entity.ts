import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { RoleMaster } from "./role_master.entity";

@Entity()
export class RoleAccess {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => RoleMaster, rolemaster => rolemaster.role_access)
    master_role: RoleMaster;

    @Column()
    role_access: string;
}