import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity({ name: 'sessions' })
@Index(['userId'])
@Index(['reportId'])
@Index(['workspaceId'])
@Index(['date'])
export class PbiSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'user_email', nullable: true })
  userEmail: string;

  @Column({ name: 'report_id', nullable: true })
  reportId: string;

  @Column({ name: 'report_name', nullable: true })
  reportName: string;

  @Column({ name: 'workspace_id', nullable: true })
  workspaceId: string;

  @Column({ name: 'session_start', type: 'timestamp' })
  sessionStart: Date;

  @Column({ name: 'session_end', type: 'timestamp', nullable: true })
  sessionEnd: Date;

  @Column({ name: 'duration_seconds', nullable: true })
  durationSeconds: number;

  @Column({ name: 'idle_capped', default: false })
  idleCapped: boolean;

  @Column({ name: 'event_count', default: 1 })
  eventCount: number;

  @Column({ type: 'date' })
  date: string; // YYYY-MM-DD

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
