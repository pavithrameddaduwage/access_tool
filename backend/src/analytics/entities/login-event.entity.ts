import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

@Entity()
export class LoginEvent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Index()
  email: string;

  @Column({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  loginTime: Date;

  @Column({ nullable: true })
  timezone: string; 
  @Column()
  webtool: string;

  @Column({ nullable: true })
  ipAddress: string;

  @Column({ nullable: true })
  userAgent: string;

  @Column({ nullable: true })
  department: string;

  @Column({ nullable: true })
  location: string;
}