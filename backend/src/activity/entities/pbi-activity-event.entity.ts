import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity({ name: 'activity_events' })
@Index(['userId'])
@Index(['operation'])
@Index(['reportId'])
@Index(['workspaceId'])
@Index(['creationTime'])
@Index(['userId', 'creationTime'])
export class PbiActivityEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'event_id', unique: true })
  eventId: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'user_email', nullable: true })
  userEmail: string;

  @Column()
  operation: string;

  @Column({ nullable: true })
  activity: string;

  @Column({ name: 'workspace_id', nullable: true })
  workspaceId: string;

  @Column({ name: 'workspace_name', nullable: true })
  workspaceName: string;

  @Column({ name: 'report_id', nullable: true })
  reportId: string;

  @Column({ name: 'report_name', nullable: true })
  reportName: string;

  @Column({ name: 'report_type', nullable: true })
  reportType: string;

  @Column({ name: 'dashboard_id', nullable: true })
  dashboardId: string;

  @Column({ name: 'dashboard_name', nullable: true })
  dashboardName: string;

  @Column({ name: 'dataset_id', nullable: true })
  datasetId: string;

  @Column({ name: 'dataset_name', nullable: true })
  datasetName: string;

  @Column({ name: 'client_ip', nullable: true })
  clientIp: string;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string;

  @Column({ name: 'is_success', default: true })
  isSuccess: boolean;

  @Column({ name: 'distribution_method', nullable: true })
  distributionMethod: string;

  @Column({ name: 'consumption_method', nullable: true })
  consumptionMethod: string;

  @Column({ name: 'creation_time', type: 'timestamp' })
  creationTime: Date;

  @Column({ name: 'request_id', nullable: true })
  requestId: string;

  @Column({ name: 'raw_json', type: 'jsonb', nullable: true })
  rawJson: any;

  @CreateDateColumn({ name: 'pulled_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  pulledAt: Date;
}
