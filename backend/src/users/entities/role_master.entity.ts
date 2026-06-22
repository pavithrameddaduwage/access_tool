import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { UserRoles } from "./user_roles.entity";

@Entity()
export class RoleMaster {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    role: string;

    @OneToMany(() => UserRoles, userroles => userroles.role)
    user_roles: UserRoles[];
}