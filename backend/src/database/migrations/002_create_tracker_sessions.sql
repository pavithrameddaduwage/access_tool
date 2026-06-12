-- ============================================================================
-- 002_create_tracker_sessions.sql
-- ----------------------------------------------------------------------------
-- NEW TABLE (Angular tracker session summary).
--
-- REFERENCE ONLY. Created/maintained by TypeORM `synchronize: true` from:
--     backend/src/tracking/entities/tracker-session.entity.ts  (Step 3)
-- Keep this .sql in sync with the entity.
--
-- NOTE: named `tracker_sessions` (NOT `sessions`) on purpose — a `sessions`
-- table already exists for Power BI audit-derived sessions (PbiSession).
-- This table is the *engagement* session: one continuous visit by one user to
-- one dashboard, with rolled-up engaged time + interaction counters. `id` is
-- supplied by the client (UUID generated in startTracking()), so there is NO
-- DEFAULT on the primary key — the row is upserted on each 30s flush.
-- ============================================================================

CREATE TABLE IF NOT EXISTS tracker_sessions (
  id               UUID         PRIMARY KEY,             -- client-generated session UUID
  user_id          VARCHAR(255) NOT NULL,
  dashboard_id     VARCHAR(255) NOT NULL,
  tab_name         VARCHAR(255),
  department       VARCHAR(255),
  engaged_seconds  INTEGER      NOT NULL DEFAULT 0,      -- excludes idle + tab-hidden time
  click_count      INTEGER      NOT NULL DEFAULT 0,
  scroll_count     INTEGER      NOT NULL DEFAULT 0,
  copy_count       INTEGER      NOT NULL DEFAULT 0,
  keydown_count    INTEGER      NOT NULL DEFAULT 0,
  select_count     INTEGER      NOT NULL DEFAULT 0,
  is_active        BOOLEAN      NOT NULL DEFAULT TRUE,
  idle_expired     BOOLEAN      NOT NULL DEFAULT FALSE,  -- session finalized by idle cutoff (not beforeunload)
  started_at       TIMESTAMPTZ  NOT NULL,
  last_flush_at    TIMESTAMPTZ,
  ended_at         TIMESTAMPTZ,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tracker_sessions_user_date
  ON tracker_sessions(user_id, started_at);

CREATE INDEX IF NOT EXISTS idx_tracker_sessions_dashboard
  ON tracker_sessions(dashboard_id, started_at);
