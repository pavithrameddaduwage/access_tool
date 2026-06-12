-- ============================================================================
-- 005_create_component_view_counts.sql
-- ----------------------------------------------------------------------------
-- NEW TABLE (per-user view counts across Power BI component types).
--
-- REFERENCE ONLY. Created/maintained by TypeORM `synchronize: true` from:
--     backend/src/tracking/entities/component-view-count.entity.ts
-- Keep this .sql in sync with the entity.
--
-- Populated from BOTH pipelines:
--   A) Angular tracker  -> POST /api/tracking/view (real-time route/iframe nav)
--   B) Power BI audit   -> daily sync maps operation -> component_type
-- Both paths UPSERT on (user_id, component_type, component_id), incrementing
-- view_count and bumping last_viewed_at.
-- ============================================================================

CREATE TABLE IF NOT EXISTS component_view_counts (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         VARCHAR(255) NOT NULL,
  component_type  VARCHAR(50)  NOT NULL, -- report | dashboard | dashboard_page | dataset | visual
  component_id    VARCHAR(255) NOT NULL,
  component_name  VARCHAR(500),
  workspace_id    VARCHAR(255),
  view_count      INTEGER      NOT NULL DEFAULT 0,
  last_viewed_at  TIMESTAMPTZ,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_cvc_user_type_component UNIQUE (user_id, component_type, component_id)
);

CREATE INDEX IF NOT EXISTS idx_cvc_user        ON component_view_counts(user_id);
CREATE INDEX IF NOT EXISTS idx_cvc_component   ON component_view_counts(component_type, component_id);
CREATE INDEX IF NOT EXISTS idx_cvc_last_viewed ON component_view_counts(last_viewed_at);
