import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { UserRoles } from "./user_roles.entity";


@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number;
    
    @Column({ unique: true })
    email: string;

    @Column({ nullable: true })
    name: string;

    @OneToMany(() => UserRoles, userroles => userroles.user, { cascade: true })
    user_roles: UserRoles[];

    @Column({ default: true })
    is_active: boolean;
}