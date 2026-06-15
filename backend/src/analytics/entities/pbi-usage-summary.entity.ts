import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, Unique } from 'typeorm';

@Entity({ name: 'usage_summary' })
@Unique(['date', 'userId', 'reportId'])
@Index(['date'])
@Index(['userId'])
@Index(['reportId'])
@Index(['workspaceId'])
export class PbiUsageSummary {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'date' })
  date: string; // YYYY-MM-DD

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'user_email', nullable: true })
  userEmail: string;

  @Column({ name: 'workspace_id', nullable: true })
  workspaceId: string;

  @Column({ name: 'workspace_name', nullable: true })
  workspaceName: string;

  @Column({ name: 'report_id', nullable: true })
  reportId: string;

  @Column({ name: 'report_name', nullable: true })
  reportName: string;

  @Column({ name: 'view_count', default: 0 })
  viewCount: number;

  @Column({ name: 'filter_count', default: 0 })
  filterCount: number;

  @Column({ name: 'export_count', default: 0 })
  exportCount: number;

  @Column({ name: 'estimated_duration_sec', default: 0 })
  estimatedDurationSec: number;

  @Column({ name: 'unique_days_active', default: 1 })
  uniqueDaysActive: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
