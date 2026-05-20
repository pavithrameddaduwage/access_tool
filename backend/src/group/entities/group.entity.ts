import { Entity, Column, PrimaryGeneratedColumn, Unique, OneToMany } from 'typeorm';
import { Dashboard } from '../../dashboard/entities/dashboard.entity';

@Entity()
@Unique(['group'])
export class Group {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  group: string;

  @OneToMany(() => Dashboard, dashboard => dashboard.group)
  dashboards: Dashboard[];
}