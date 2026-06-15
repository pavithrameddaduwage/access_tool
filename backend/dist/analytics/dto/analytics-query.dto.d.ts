export declare const PERIODS: readonly ["7d", "30d", "90d"];
export type Period = (typeof PERIODS)[number];
export declare const PERIOD_DAYS: Readonly<Record<Period, number>>;
export declare const DEFAULT_PERIOD: Period;
export declare class AnalyticsQueryDto {
    period?: Period;
    department?: string;
}
export declare function periodToDays(period?: Period): number;
