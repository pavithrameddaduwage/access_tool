import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

/**
 * Raw interaction event captured by the Angular tracker.
 *
 * One row per discrete browser event (click, scroll, copy, keydown, select,
 * visibility, focus, wheel, mousestop). Rolled-up counters and engaged time
 * live on {@link TrackerSession}. Rows are server-inserted, so the PK keeps a
 * database default.
 *
 * @see backend/src/database/migrations/001_create_tracker_usage_events.sql
 */
@Entity({ name: 'tracker_usage_events' })
@Index(['sessionId'])
@Index(['userId', 'createdAt'])
export class TrackerUsageEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'session_id', type: 'uuid' })
  sessionId: string;

  @Column({ name: 'user_id', type: 'varchar', length: 255 })
  userId: string;

  @Column({ name: 'dashboard_id', type: 'varchar', length: 255 })
  dashboardId: string;

  @Column({ name: 'tab_name', type: 'varchar', length: 255, nullable: true })
  tabName: string | null;

  /** click | scroll | copy | keydown | select | visibility | focus | wheel | mousestop */
  @Column({ name: 'event_type', type: 'varchar', length: 50 })
  eventType: string;

  @Column({ name: 'event_data', type: 'jsonb', nullable: true })
  eventData: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
