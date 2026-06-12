import { IsOptional, IsString, IsUUID, IsISO8601, MaxLength } from 'class-validator';

/**
 * Payload for `POST /api/tracking/session/start`.
 * Creates the initial {@link TrackerSession} row when `startTracking()` runs
 * in the browser. The session UUID is generated client-side.
 */
export class StartSessionDto {
  /** Client-generated session UUID. */
  @IsUUID()
  sessionId: string;

  @IsString()
  @MaxLength(255)
  userId: string;

  @IsString()
  @MaxLength(255)
  dashboardId: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  tabName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  department?: string;

  /** ISO 8601 timestamp when tracking started (client clock). */
  @IsISO8601()
  startedAt: string;
}
