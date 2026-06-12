import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Unique,
} from 'typeorm';

/**
 * Per-user view counts across Power BI component types.
 *
 * Fed by both pipelines and UPSERTed on `(userId, componentType, componentId)`:
 *  - Angular tracker  → `POST /api/tracking/view` (real-time route/iframe nav)
 *  - Power BI audit   → daily sync maps `operation` → `componentType`
 *
 * @see backend/src/database/migrations/005_create_component_view_counts.sql
 */
@Entity({ name: 'component_view_counts' })
@Unique('uq_cvc_user_type_component', ['userId', 'componentType', 'componentId'])
@Index(['userId'])
@Index(['componentType', 'componentId'])
@Index(['lastViewedAt'])
export class ComponentViewCount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'varchar', length: 255 })
  userId: string;

  /** report | dashboard | dashboard_page | dataset | visual */
  @Column({ name: 'component_type', type: 'varchar', length: 50 })
  componentType: string;

  @Column({ name: 'component_id', type: 'varchar', length: 255 })
  componentId: string;

  @Column({ name: 'component_name', type: 'varchar', length: 500, nullable: true })
  componentName: string | null;

  @Column({ name: 'workspace_id', type: 'varchar', length: 255, nullable: true })
  workspaceId: string | null;

  @Column({ name: 'view_count', type: 'int', default: 0 })
  viewCount: number;

  @Column({ name: 'last_viewed_at', type: 'timestamptz', nullable: true })
  lastViewedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
