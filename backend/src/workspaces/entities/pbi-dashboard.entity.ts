import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'dashboards' })
export class PbiDashboard {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'dashboard_id', unique: true })
  dashboardId: string;

  @Column({ name: 'workspace_id' })
  workspaceId: string;

  @Column()
  name: string;

  @Column({ name: 'is_read_only', default: false })
  isReadOnly: boolean;

  @Column({ name: 'web_url', type: 'text', nullable: true })
  webUrl: string;

  @Column({ name: 'embed_url', type: 'text', nullable: true })
  embedUrl: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'synced_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  syncedAt: Date;
}
