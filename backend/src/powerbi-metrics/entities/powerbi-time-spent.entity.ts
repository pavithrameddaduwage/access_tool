import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

@Entity()
export class PowerBITimeSpent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  userId: string;

  @Column()
  @Index()
  reportId: string;

  @Column()
  reportName: string;

  @Column({ nullable: true })
  @Index()
  workspaceId: string;

  @Column({ nullable: true })
  workspaceName: string;

  @Column()
  tabName: string;

  @Column({ type: 'integer' })
  durationSeconds: number;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  @Index()
  timestamp: Date;
}
