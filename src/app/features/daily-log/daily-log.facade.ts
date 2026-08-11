import {
  computed,
  inject,
  resource,
  ResourceRef,
  Service,
  Signal,
  signal,
  WritableSignal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../core/services/platform/auth.service';
import { DailyLogsService } from '../../core/services/data/daily-log/daily-log.service';
import type { DailyLog } from '../../core/services/data/daily-log/daily-log.model';
import { UserSettingsService } from '../../core/services/data/user-settings.service';
import type { ModuleSettings } from '../../core/services/data/user-settings.service';
import type { Result } from '../../core/types/result';
import { DialogService } from '../../shared/services/dialog.service';
import { DialogType } from '../../shared/enums/dialog-type.enum';
import { WeightUnit } from '../../shared/enums/weight-unit.enum';
import { LogMetricKey } from '../../shared/enums/log-metric-key.enum';
import type { LogEntryFormData } from '../../shared/components/log-entry-dialog/log-entry-dialog.component';

@Service({ autoProvided: false })
export class DailyLogFacade {
  private static readonly RECENT_ENTRIES_LIMIT: number = 7;
  private readonly authService: AuthService = inject(AuthService);
  private readonly dailyLogsService: DailyLogsService = inject(DailyLogsService);
  private readonly dialogService: DialogService = inject(DialogService);
  private readonly translateService: TranslateService = inject(TranslateService);
  private readonly userSettingsService: UserSettingsService = inject(UserSettingsService);

  readonly translation: Signal<Record<string, string>> = toSignal(
    this.translateService.stream('DAILY_LOG'),
    { initialValue: {} as Record<string, string> },
  );

  private readonly _recentEntriesResource: ResourceRef<Result<DailyLog[]> | undefined> = resource({
    params: () => ({ userId: this.authService.userId() }),
    loader: ({ params }) =>
      this.dailyLogsService.getRecentDailyLogs(params.userId, DailyLogFacade.RECENT_ENTRIES_LIMIT),
  });

  private readonly _userSettingsResource: ResourceRef<Result<ModuleSettings> | undefined> = resource({
    params: () => ({ userId: this.authService.userId() }),
    loader: ({ params }) => this.userSettingsService.getModuleSettings(params.userId),
  });

  readonly weightUnit: Signal<WeightUnit> = computed(() => {
    const result: Result<ModuleSettings> | undefined = this._userSettingsResource.value();
    return result?.success ? result.data.workout.weightUnit : WeightUnit.Kg;
  });

  // Settings failing to load shows every column rather than none — a metric the
  // user did hide is a smaller surprise than a card that has lost its tiles.
  readonly hiddenMetrics: Signal<readonly LogMetricKey[]> = computed(() => {
    const result: Result<ModuleSettings> | undefined = this._userSettingsResource.value();
    return result?.success ? result.data.dailyLog.hiddenMetrics : [];
  });

  readonly isLoading: Signal<boolean> = computed(() => this._recentEntriesResource.isLoading());

  readonly hasError: Signal<boolean> = computed(() => {
    const result = this._recentEntriesResource.value();
    return !!result && !result.success;
  });

  readonly entries: Signal<DailyLog[]> = computed(() => {
    const result = this._recentEntriesResource.value();
    if (!result?.success) {
      return [];
    }
    return result.data;
  });

  readonly isEmpty: Signal<boolean> = computed(
    () => !this.isLoading() && !this.hasError() && !this.entries().length,
  );

  async openLogDialog(loggedDate: string, existingEntry?: DailyLog): Promise<void> {
    const formData: LogEntryFormData | undefined = await this.dialogService.open(
      DialogType.LogEntry,
      { date: loggedDate, existingEntry, weightUnit: this.weightUnit() },
    );
    if (!formData) {
      return;
    }
    await this.upsertLog(formData);
  }

  private readonly _saveError: WritableSignal<boolean> = signal(false);

  readonly saveError: Signal<boolean> = this._saveError;

  private async upsertLog(formData: LogEntryFormData): Promise<void> {
    this._saveError.set(false);
    const result: Result<DailyLog> = await this.dailyLogsService.upsertDailyLog({
      userId: this.authService.userId(),
      loggedDate: formData.loggedDate,
      sleepHours: formData.sleepHours,
      weightKg: formData.weightKg,
      waterLiters: formData.waterLiters,
      waistCm: formData.waistCm,
    });
    if (!result.success) {
      this._saveError.set(true);
      return;
    }
    this._recentEntriesResource.reload();
  }
}
