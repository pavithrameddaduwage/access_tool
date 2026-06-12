import { Entity, PrimaryColumn, Column, CreateDateColumn, Index } from 'typeorm';

/**
 * Engagement session captured by the Angular tracker.
 *
 * One row = one continuous visit by one user to one dashboard. The primary key
 * is the client-generated session UUID (created in `startTracking()`), so there
 * is NO database default — rows are UPSERTed on each 30s flush and on session end.
 *
 * Table name is `tracker_sessions` (NOT `sessions`) because a `sessions` table
 * already exists for Power BI audit-derived sessions (PbiSession).
 *
 * @see backend/src/database/migrations/002_create_tracker_sessions.sql
 */
@Entity({ name: 'tracker_sessions' })
@Index(['userId', 'startedAt'])
@Index(['dashboardId', 'startedAt'])
export class TrackerSession {
  /** Client-generated session UUID (set in the browser, not the DB). */
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'varchar', length: 255 })
  userId: string;

  @Column({ name: 'dashboard_id', type: 'varchar', length: 255 })
  dashboardId: string;

  @Column({ name: 'tab_name', type: 'varchar', length: 255, nullable: true })
  tabName: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  department: string | null;

  /** Active engaged time in seconds — excludes idle and tab-hidden periods. */
  @Column({ name: 'engaged_seconds', type: 'int', default: 0 })
  engagedSeconds: number;

  @Column({ name: 'click_count', type: 'int', default: 0 })
  clickCount: number;

  @Column({ name: 'scroll_count', type: 'int', default: 0 })
  scrollCount: number;

  @Column({ name: 'copy_count', type: 'int', default: 0 })
  copyCount: number;

  @Column({ name: 'keydown_count', type: 'int', default: 0 })
  keydownCount: number;

  @Column({ name: 'select_count', type: 'int', default: 0 })
  selectCount: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  /** True when the session was finalized by the idle cutoff (not beforeunload). */
  @Column({ name: 'idle_expired', type: 'boolean', default: false })
  idleExpired: boolean;

  @Column({ name: 'started_at', type: 'timestamptz' })
  startedAt: Date;

  @Column({ name: 'last_flush_at', type: 'timestamptz', nullable: true })
  lastFlushAt: Date | null;

  @Column({ name: 'ended_at', type: 'timestamptz', nullable: true })
  endedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
