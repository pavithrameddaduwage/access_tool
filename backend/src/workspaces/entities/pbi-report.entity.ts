import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'reports' })
export class PbiReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'report_id', unique: true })
  reportId: string;

  @Column({ name: 'workspace_id' })
  workspaceId: string;

  @Column()
  name: string;

  @Column({ name: 'report_type', nullable: true })
  reportType: string;

  @Column({ name: 'web_url', type: 'text', nullable: true })
  webUrl: string;

  @Column({ name: 'embed_url', type: 'text', nullable: true })
  embedUrl: string;

  @Column({ name: 'dataset_id', nullable: true })
  datasetId: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'synced_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  syncedAt: Date;
}
