// src/workspace-mapping/entities/workspace-mapping.entity.ts
import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity()
export class WorkspaceMapping {
  @PrimaryColumn()
  workspaceId: string;

  @Column()
  originalName: string;

  @Column()
  displayName: string;

  @Column({ default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}