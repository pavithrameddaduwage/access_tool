-- ============================================================================
-- 001_create_tracker_usage_events.sql
-- ----------------------------------------------------------------------------
-- NEW TABLE (Angular tracker raw events).
--
-- REFERENCE ONLY. The app runs with TypeORM `synchronize: true`, so this table
-- is actually created/maintained from the entity:
--     backend/src/tracking/entities/tracker-usage-event.entity.ts  (Step 3)
-- This .sql is kept as portable documentation and for environments that prefer
-- to provision the schema manually. Keep it in sync with the entity.
--
-- One row per discrete user interaction captured by the browser tracker
-- (click, scroll, copy, keydown, select, visibility, focus, wheel, mousestop).
-- Rolled-up counters live in `tracker_sessions`.
-- ============================================================================

CREATE TABLE IF NOT EXISTS tracker_usage_events (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    UUID         NOT NULL,
  user_id       VARCHAR(255) NOT NULL,
  dashboard_id  VARCHAR(255) NOT NULL,
  tab_name      VARCHAR(255),
  event_type    VARCHAR(50)  NOT NULL, -- click, scroll, copy, keydown, select, visibility, focus, wheel, mousestop
  event_data    JSONB,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tracker_usage_events_session
  ON tracker_usage_events(session_id);

CREATE INDEX IF NOT EXISTS idx_tracker_usage_events_user_date
  ON tracker_usage_events(user_id, created_at);
