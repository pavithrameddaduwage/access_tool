import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Dashboard } from '../../dashboard/entities/dashboard.entity';


@Entity()
export class UserDashboard {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  email: string;

  @Column()
  userName: string;

  @Column()
  department: string;

  @ManyToOne(() => Dashboard)
  @JoinColumn({ name: 'dashboardId' })
  dashboard: Dashboard;

  @Column()
  dashboardId: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true, type: 'timestamp' })
  lastActiveAt?: Date;
}