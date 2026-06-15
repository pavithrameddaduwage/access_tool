import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity({ name: 'sync_log' })
export class PbiSyncLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'sync_type' })
  syncType: string; // activity, workspaces, reports

  @Column({ name: 'sync_date', type: 'date', nullable: true })
  syncDate: string; // YYYY-MM-DD

  @Column()
  status: string; // success, failed, partial

  @Column({ name: 'events_pulled', default: 0 })
  eventsPulled: number;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string;

  @CreateDateColumn({ name: 'started_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  startedAt: Date;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt: Date;
}
