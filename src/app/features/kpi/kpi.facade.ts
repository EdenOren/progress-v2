import { TileStatus } from '@edenoren/ui-kit';
import {
  computed,
  inject,
  linkedSignal,
  resource,
  ResourceRef,
  Service,
  Signal,
  WritableSignal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../core/services/platform/auth.service';
import { DailyLogsService } from '../../core/services/data/daily-log/daily-log.service';
import { EntriesService } from '../../core/services/data/entries.service';
import { UserSettingsService } from '../../core/services/data/user-settings.service';
import type { DailyLog } from '../../core/services/data/daily-log/daily-log.model';
import type { RangeEntry } from '../../core/services/data/entries.service';
import type { WorkoutSettings } from '../../core/services/data/user-settings.service';
import type { Result } from '../../core/types/result';
import { WeightUnit } from '../../shared/enums/weight-unit.enum';
import { formatDuration } from '../../shared/utils/duration';
import { toLocalDateString, toLocalDateStringDaysAgo } from '../../shared/utils/date';
import {
  cmToIn,
  kgToLb,
  roundToOneDecimal,
  WAIST_UNIT_LABELS,
  WEIGHT_UNIT_LABELS,
} from '../../shared/utils/unit-conversion';
import {
  KPI_RANGE_BUCKET_DAYS,
  KPI_RANGE_DAYS,
  KpiRange,
  WIDEST_KPI_RANGE,
} from './enums/kpi-range.enum';
import { KpiTileKey } from './enums/kpi-tile-key.enum';
import {
  averageDurationSeconds,
  averageMetric,
  countWorkouts,
  daysSinceLastWorkout,
  filterEntriesWithinDays,
  filterLogsWithinDays,
  metricDelta,
  subjectFrequency,
  totalDurationSeconds,
  totalSets,
  totalVolumeKg,
  volumeSeries,
} from './utils/kpi-metrics.util';
import type { SubjectFrequency, VolumeBucket } from './utils/kpi-metrics.util';

export interface KpiTile {
  readonly key: KpiTileKey;
  readonly label: string;
  readonly value: string;
  readonly unit: string;
  readonly status: TileStatus;
}

@Service({ autoProvided: false })
export class KpiFacade {
  private static readonly MISSING_VALUE: string = '—';
  private static readonly FRESH_TRAINING_DAYS: number = 1;
  private static readonly STALE_TRAINING_DAYS: number = 4;

  private readonly authService: AuthService = inject(AuthService);
  private readonly dailyLogsService: DailyLogsService = inject(DailyLogsService);
  private readonly entriesService: EntriesService = inject(EntriesService);
  private readonly translateService: TranslateService = inject(TranslateService);
  private readonly userSettingsService: UserSettingsService = inject(UserSettingsService);

  // Read once per visit rather than per computation: the facade is provided by
  // the page, so leaving the tab and coming back picks up the new day.
  private readonly todayIsoDate: string = toLocalDateString(new Date());
  private readonly windowStartIsoDate: string = toLocalDateStringDaysAgo(
    new Date(),
    KPI_RANGE_DAYS[WIDEST_KPI_RANGE] - 1,
  );

  readonly translation: Signal<Record<string, string>> = toSignal(
    this.translateService.stream('KPI'),
    { initialValue: {} as Record<string, string> },
  );

  // The widest range is fetched once and narrowed in memory, so changing the
  // range redraws instantly instead of round-tripping to Supabase.
  private readonly _entriesResource: ResourceRef<Result<RangeEntry[]> | undefined> = resource({
    params: () => ({ userId: this.authService.userId() }),
    loader: ({ params }) =>
      this.entriesService.getEntriesSince(params.userId, this.windowStartIsoDate),
  });

  private readonly _dailyLogsResource: ResourceRef<Result<DailyLog[]> | undefined> = resource({
    params: () => ({ userId: this.authService.userId() }),
    loader: ({ params }) =>
      this.dailyLogsService.getDailyLogsSince(params.userId, this.windowStartIsoDate),
  });

  private readonly _userSettingsResource: ResourceRef<Result<WorkoutSettings> | undefined> =
    resource({
      params: () => ({ userId: this.authService.userId() }),
      loader: ({ params }) => this.userSettingsService.getWorkoutSettings(params.userId),
    });

  // Opens on the narrowest range that holds a session, so returning after a
  // layoff shows the training that exists rather than a wall of zeroes. Reverts
  // to that default only when the underlying data changes, never mid-visit.
  private readonly _selectedRange: WritableSignal<KpiRange> = linkedSignal<
    RangeEntry[],
    KpiRange
  >({
    source: () => this.allEntries(),
    computation: (entries) => KpiFacade.resolveDefaultRange(entries, this.todayIsoDate),
  });
  readonly selectedRange: Signal<KpiRange> = this._selectedRange;

  readonly isRangeWeek: Signal<boolean> = computed(
    () => this._selectedRange() === KpiRange.Week,
  );
  readonly isRangeMonth: Signal<boolean> = computed(
    () => this._selectedRange() === KpiRange.Month,
  );
  readonly isRangeQuarter: Signal<boolean> = computed(
    () => this._selectedRange() === KpiRange.Quarter,
  );

  readonly weightUnit: Signal<WeightUnit> = computed(() => {
    const result = this._userSettingsResource.value();
    return result?.success ? result.data.weightUnit : WeightUnit.Kg;
  });

  private readonly allEntries: Signal<RangeEntry[]> = computed(() => {
    const result = this._entriesResource.value();
    if (!result?.success) {
      return [];
    }
    return result.data;
  });

  private readonly allLogs: Signal<DailyLog[]> = computed(() => {
    const result = this._dailyLogsResource.value();
    if (!result?.success) {
      return [];
    }
    return result.data;
  });

  private readonly rangeDays: Signal<number> = computed(
    () => KPI_RANGE_DAYS[this._selectedRange()],
  );

  private readonly rangeEntries: Signal<RangeEntry[]> = computed(() =>
    filterEntriesWithinDays(this.allEntries(), this.rangeDays(), this.todayIsoDate),
  );

  private readonly rangeLogs: Signal<DailyLog[]> = computed(() =>
    filterLogsWithinDays(this.allLogs(), this.rangeDays(), this.todayIsoDate),
  );

  readonly isLoading: Signal<boolean> = computed(
    () => this._entriesResource.isLoading() || this._dailyLogsResource.isLoading(),
  );

  readonly hasError: Signal<boolean> = computed(() => {
    const entriesResult = this._entriesResource.value();
    const logsResult = this._dailyLogsResource.value();
    return (!!entriesResult && !entriesResult.success) || (!!logsResult && !logsResult.success);
  });

  // Emptiness is judged over the whole fetched window, not the selected range:
  // a quiet week should show zeroes next to a working range picker, not swallow
  // the page in an empty state.
  readonly isEmpty: Signal<boolean> = computed(
    () =>
      !this.isLoading() &&
      !this.hasError() &&
      !this.allEntries().length &&
      !this.allLogs().length,
  );

  readonly trainingTiles: Signal<KpiTile[]> = computed(() => {
    const labels: Record<string, string> = this.translation();
    const entries: RangeEntry[] = this.rangeEntries();
    // Measured against every fetched session, not the selected range: a
    // fortnight off is the answer even when the range is a week.
    const restDays: number | null = daysSinceLastWorkout(this.allEntries(), this.todayIsoDate);
    return [
      {
        key: KpiTileKey.Workouts,
        label: labels['WORKOUTS'] ?? '',
        value: String(countWorkouts(entries)),
        unit: '',
        status: TileStatus.Neutral,
      },
      {
        key: KpiTileKey.TotalTime,
        label: labels['TOTAL_TIME'] ?? '',
        value: formatDuration(totalDurationSeconds(entries)) || KpiFacade.MISSING_VALUE,
        unit: '',
        status: TileStatus.Neutral,
      },
      {
        key: KpiTileKey.AverageSession,
        label: labels['AVG_SESSION'] ?? '',
        value: formatDuration(averageDurationSeconds(entries)) || KpiFacade.MISSING_VALUE,
        unit: '',
        status: TileStatus.Neutral,
      },
      {
        key: KpiTileKey.DaysSinceLast,
        label: labels['DAYS_SINCE_LAST'] ?? '',
        value: restDays === null ? KpiFacade.MISSING_VALUE : String(restDays),
        unit: restDays === null ? '' : (labels['DAYS_UNIT'] ?? ''),
        status: KpiFacade.resolveRestStatus(restDays),
      },
    ];
  });

  readonly volumeTiles: Signal<KpiTile[]> = computed(() => {
    const labels: Record<string, string> = this.translation();
    const entries: RangeEntry[] = this.rangeEntries();
    const volume: number = totalVolumeKg(entries);
    return [
      {
        key: KpiTileKey.Volume,
        label: labels['VOLUME'] ?? '',
        value: Math.round(this.toDisplayWeight(volume)).toLocaleString(),
        unit: WEIGHT_UNIT_LABELS[this.weightUnit()],
        status: TileStatus.Neutral,
      },
      {
        key: KpiTileKey.Sets,
        label: labels['SETS'] ?? '',
        value: String(totalSets(entries)),
        unit: '',
        status: TileStatus.Neutral,
      },
    ];
  });

  readonly healthTiles: Signal<KpiTile[]> = computed(() => {
    const labels: Record<string, string> = this.translation();
    const logs: DailyLog[] = this.rangeLogs();
    const sleep: number | null = averageMetric(logs, (log) => log.sleepHours);
    const water: number | null = averageMetric(logs, (log) => log.waterLiters);
    const weightChange: number | null = metricDelta(logs, (log) => log.weightKg);
    const waistChange: number | null = metricDelta(logs, (log) => log.waistCm);
    return [
      {
        key: KpiTileKey.Sleep,
        label: labels['SLEEP_AVERAGE'] ?? '',
        value: KpiFacade.formatMeasurement(sleep),
        unit: sleep === null ? '' : (labels['SLEEP_UNIT'] ?? ''),
        status: TileStatus.Neutral,
      },
      {
        key: KpiTileKey.Water,
        label: labels['WATER_AVERAGE'] ?? '',
        value: KpiFacade.formatMeasurement(water),
        unit: water === null ? '' : (labels['WATER_UNIT'] ?? ''),
        status: TileStatus.Neutral,
      },
      {
        key: KpiTileKey.Weight,
        label: labels['WEIGHT_CHANGE'] ?? '',
        value: KpiFacade.formatSignedChange(
          weightChange === null ? null : this.toDisplayWeight(weightChange),
        ),
        unit: weightChange === null ? '' : WEIGHT_UNIT_LABELS[this.weightUnit()],
        status: TileStatus.Neutral,
      },
      {
        key: KpiTileKey.Waist,
        label: labels['WAIST_CHANGE'] ?? '',
        value: KpiFacade.formatSignedChange(
          waistChange === null ? null : this.toDisplayWaist(waistChange),
        ),
        unit: waistChange === null ? '' : WAIST_UNIT_LABELS[this.weightUnit()],
        status: TileStatus.Neutral,
      },
    ];
  });

  readonly volumeBuckets: Signal<VolumeBucket[]> = computed(() =>
    volumeSeries(
      this.rangeEntries(),
      this.rangeDays(),
      KPI_RANGE_BUCKET_DAYS[this._selectedRange()],
      this.todayIsoDate,
    ).map((bucket) => ({
      startIsoDate: bucket.startIsoDate,
      volumeKg: this.toDisplayWeight(bucket.volumeKg),
    })),
  );

  readonly hasVolume: Signal<boolean> = computed(() =>
    this.volumeBuckets().some((bucket) => bucket.volumeKg > 0),
  );

  readonly subjectBreakdown: Signal<SubjectFrequency[]> = computed(() =>
    subjectFrequency(this.rangeEntries()),
  );

  readonly hasSubjectBreakdown: Signal<boolean> = computed(
    () => !!this.subjectBreakdown().length,
  );

  readonly volumeUnit: Signal<string> = computed(() => WEIGHT_UNIT_LABELS[this.weightUnit()]);

  selectRange(range: KpiRange): void {
    this._selectedRange.set(range);
  }

  private toDisplayWeight(kilograms: number): number {
    return this.weightUnit() === WeightUnit.Lb ? kgToLb(kilograms) : kilograms;
  }

  private toDisplayWaist(centimetres: number): number {
    return this.weightUnit() === WeightUnit.Lb ? cmToIn(centimetres) : centimetres;
  }

  private static formatMeasurement(value: number | null): string {
    if (value === null) {
      return KpiFacade.MISSING_VALUE;
    }
    return String(roundToOneDecimal(value));
  }

  // A gain needs its sign spelled out; a loss already carries one.
  private static formatSignedChange(value: number | null): string {
    if (value === null) {
      return KpiFacade.MISSING_VALUE;
    }
    const rounded: number = roundToOneDecimal(value);
    return rounded > 0 ? `+${rounded}` : String(rounded);
  }

  private static resolveDefaultRange(entries: RangeEntry[], todayIsoDate: string): KpiRange {
    const narrowestFirst: KpiRange[] = [KpiRange.Week, KpiRange.Month, KpiRange.Quarter];
    const populated: KpiRange | undefined = narrowestFirst.find(
      (range) => filterEntriesWithinDays(entries, KPI_RANGE_DAYS[range], todayIsoDate).length,
    );
    return populated ?? KpiRange.Month;
  }

  private static resolveRestStatus(restDays: number | null): TileStatus {
    if (restDays === null) {
      return TileStatus.Neutral;
    }
    if (restDays <= KpiFacade.FRESH_TRAINING_DAYS) {
      return TileStatus.Good;
    }
    return restDays >= KpiFacade.STALE_TRAINING_DAYS ? TileStatus.Warn : TileStatus.Neutral;
  }
}
