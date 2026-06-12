import { IsISO8601, IsOptional, IsString, IsUUID } from 'class-validator';

/**
 * Payload for `POST /api/tracking/session/end`.
 * Marks a {@link TrackerSession} ended. Usually superseded by a flush with
 * `isEnding=true`, but exposed separately for explicit teardown.
 */
export class EndSessionDto {
  @IsUUID()
  sessionId: string;

  @IsOptional()
  @IsString()
  userId?: string;

  /** ISO 8601 timestamp when the session ended (client clock). */
  @IsOptional()
  @IsISO8601()
  endedAt?: string;
}
