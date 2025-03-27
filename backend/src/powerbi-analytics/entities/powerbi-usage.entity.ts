import { Entity, Column, PrimaryGeneratedColumn, Index } from 'typeorm';

@Entity()
@Index(['workspaceId', 'datasetId', 'reportId', 'userId', 'date'], { unique: true })
export class PowerbiUsage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  workspaceId: string;

  @Column()
  datasetId: string;

  @Column()
  reportId: string;

  @Column({ nullable: true })
  reportName: string;

  @Column()
  userId: string;

  @Column()
  userKey: string;

  @Column({ type: 'date' })
  date: Date;

  @Column()
  distributionMethod: string;

  @Column()
  consumptionMethod: string;

  @Column('int')
  views: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  recordedAt: Date;
}