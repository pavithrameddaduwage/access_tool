import { Role } from "src/roles/entities/role.entity";
import { Webtool } from "src/webtool/entities/webtool.entity";
import { Column, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class UserWebtool {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  email: string;

  @Column()
  userName: string;

  @Column()
  department: string;

  @ManyToOne(() => Webtool)
  @JoinColumn({ name: 'webtoolId' })
  webtool: Webtool;

  @Column()
  webtoolId: number;

  @ManyToMany(() => Role)
  @JoinTable()
  roles: Role[];
}