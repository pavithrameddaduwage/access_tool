// src/user-webtool/entities/user-webtool.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Webtool } from '../../webtool/entities/webtool.entity';
import { Role } from '../../roles/entities/role.entity';

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

  @Column()
  webtoolId: number;

  @Column()
  roleId: number;

  @ManyToOne(() => Webtool)
  @JoinColumn({ name: 'webtoolId' })
  webtool: Webtool;

  @ManyToOne(() => Role)
  @JoinColumn({ name: 'roleId' })
  role: Role;
}