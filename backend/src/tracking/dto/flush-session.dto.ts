import {
  IsArray,
  IsBoolean,
  IsISO8601,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * A single raw interaction event in a flush batch.
 * Mirrors {@link TrackerUsageEvent} (server fills id/created_at).
 */
export class FlushEventDto {
  /** click | scroll | copy | keydown | select | visibility | focus | wheel | mousestop */
  @IsString()
  @MaxLength(50)
  eventType: string;

  @IsOptional()
  @IsObject()
  eventData?: Record<string, unknown>;

  /** ISO 8601 timestamp of the event (client clock). */
  @IsOptional()
  @IsISO8601()
  timestamp?: string;
}

/**
 * Payload for `POST /api/tracking/session/flush`.
 * Sent every 30s (and on `beforeunload`). Upserts the session summary and
 * batch-inserts any buffered raw events.
 */
export class FlushSessionDto {
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

  /** Cumulative engaged seconds (idle + tab-hidden excluded). */
  @IsInt()
  @Min(0)
  engagedSeconds: number;

  @IsInt()
  @Min(0)
  clickCount: number;

  @IsInt()
  @Min(0)
  scrollCount: number;

  @IsInt()
  @Min(0)
  copyCount: number;

  @IsInt()
  @Min(0)
  keydownCount: number;

  @IsInt()
  @Min(0)
  selectCount: number;

  /** True when sent from `beforeunload` or idle expiry — marks the session ended. */
  @IsBoolean()
  isEnding: boolean;

  /** True when the session ended specifically because all idle timers expired. */
  @IsOptional()
  @IsBoolean()
  idleExpired?: boolean;

  /** ISO 8601 timestamp of this flush (client clock). */
  @IsISO8601()
  timestamp: string;

  /** Raw events buffered since the last flush (optional). */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FlushEventDto)
  events?: FlushEventDto[];
}
