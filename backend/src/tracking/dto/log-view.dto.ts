import { IsIn, IsISO8601, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

/** The five component types tracked for view counts. */
export const COMPONENT_TYPES = [
  'report',
  'dashboard',
  'dashboard_page',
  'dataset',
  'visual',
] as const;

export type ComponentType = (typeof COMPONENT_TYPES)[number];

/**
 * Payload for `POST /api/tracking/view`.
 * Logged on every route change / Power BI iframe navigation; upserts into
 * `component_view_counts` (increment view_count, bump last_viewed_at).
 */
export class LogViewDto {
  @IsString()
  @MaxLength(255)
  userId: string;

  @IsIn(COMPONENT_TYPES)
  componentType: ComponentType;

  @IsString()
  @MaxLength(255)
  componentId: string;

  @IsString()
  @MaxLength(500)
  componentName: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  workspaceId?: string;

  @IsUUID()
  sessionId: string;

  /** ISO 8601 timestamp of the view (client clock). */
  @IsISO8601()
  timestamp: string;
}
