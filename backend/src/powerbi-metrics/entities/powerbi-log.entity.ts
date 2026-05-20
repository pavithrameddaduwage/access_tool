// src/powerbi-metrics/entities/powerbi-log.entity.ts
import { Entity, PrimaryColumn, Column, Index } from 'typeorm';

@Entity()
export class PowerBILog {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  recordType: number;

  @Column({ type: 'timestamptz' })
  @Index()
  creationTime: Date;

  @Column()
  operation: string;

  @Column()
  organizationId: string;

  @Column()
  userType: number;

  @Column()
  userKey: string;

  @Column()
  workload: string;

  @Column()
  @Index()
  userId: string;

  @Column({ nullable: true })
  clientIP: string;

  @Column({ nullable: true })
  userAgent: string;

  @Column({ nullable: true })
  activity: string;

  @Column({ nullable: true })
  itemName: string;

  @Column({ nullable: true })
  workSpaceName: string;

  @Column({ nullable: true })
  datasetName: string;

  @Column({ nullable: true })
  reportName: string;

  @Column({ nullable: true })
  capacityId: string;

  @Column({ nullable: true })
  capacityName: string;

  @Column({ nullable: true })
  @Index()
  workspaceId: string;

  @Column({ nullable: true })
  objectId: string;

  @Column({ nullable: true })
  datasetId: string;

  @Column({ nullable: true })
  @Index()
  reportId: string;

  @Column({ nullable: true })
  artifactId: string;

  @Column({ nullable: true })
  artifactName: string;

  @Column({ nullable: true })
  isSuccess: boolean;

  @Column({ nullable: true })
  reportType: string;

  @Column({ nullable: true })
  requestId: string;

  @Column({ nullable: true })
  activityId: string;

  @Column({ nullable: true })
  distributionMethod: string;

  @Column({ nullable: true })
  consumptionMethod: string;

  @Column({ nullable: true })
  artifactKind: string;

  @Column({ nullable: true })
  refreshEnforcementPolicy: number;

  @Column({ nullable: true })
  billingType: number;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  storedAt: Date;
}