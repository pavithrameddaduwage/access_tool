import { IsIn, IsOptional, IsString } from 'class-validator';

/** Supported relative periods. */
export const PERIODS = ['7d', '30d', '90d'] as const;
export type Period = (typeof PERIODS)[number];

/** Map a period token to a day count. */
export const PERIOD_DAYS: Readonly<Record<Period, number>> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
};

/** Default period when none supplied. */
export const DEFAULT_PERIOD: Period = '30d';

/**
 * Shared query params for engagement analytics endpoints:
 * `?period=7d|30d|90d&department=sales`.
 */
export class AnalyticsQueryDto {
  @IsOptional()
  @IsIn(PERIODS)
  period?: Period;

  @IsOptional()
  @IsString()
  department?: string;
}

/** Resolve a period token (or default) to its day count. */
export function periodToDays(period?: Period): number {
  return PERIOD_DAYS[period ?? DEFAULT_PERIOD];
}
