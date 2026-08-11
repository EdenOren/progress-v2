export enum KpiRange {
  Week = 'week',
  Month = 'month',
  Quarter = 'quarter',
}

export const KPI_RANGE_DAYS: Record<KpiRange, number> = {
  [KpiRange.Week]: 7,
  [KpiRange.Month]: 30,
  [KpiRange.Quarter]: 90,
};

/**
 * Bar width per range, chosen so every range draws a readable number of bars:
 * a week of days, a month of weeks, a quarter of weeks.
 */
export const KPI_RANGE_BUCKET_DAYS: Record<KpiRange, number> = {
  [KpiRange.Week]: 1,
  [KpiRange.Month]: 7,
  [KpiRange.Quarter]: 7,
};

export const WIDEST_KPI_RANGE: KpiRange = KpiRange.Quarter;
