// src/report-mapping/entities/report-mapping.entity.ts
import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity()
export class ReportMapping {
  @PrimaryColumn()
  reportId: string;

  @Column()
  originalName: string;

  @Column()
  displayName: string;

  @Column({ nullable: true })
  workspaceId?: string;

  @Column({ default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}