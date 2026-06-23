import { computed, inject, resource, ResourceRef, Service, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../core/services/platform/auth.service';
import { DailyLogsService } from '../../core/services/data/daily-log/daily-log.service';
import type { DailyLog } from '../../core/services/data/daily-log/daily-log.model';
import type { Result } from '../../core/types/result';
import { DialogService } from '../../shared/services/dialog.service';
import { DialogType } from '../../shared/enums/dialog-type.enum';
import type { LogEntryFormData } from '../../shared/components/log-entry-dialog/log-entry-dialog.component';

@Service({ autoProvided: false })
export class DailyLogFacade {
  private readonly authService: AuthService = inject(AuthService);
  private readonly dailyLogsService: DailyLogsService = inject(DailyLogsService);
  private readonly dialogService: DialogService = inject(DialogService);
  private readonly translateService: TranslateService = inject(TranslateService);

  readonly translation: Signal<Record<string, string>> = toSignal(
    this.translateService.stream('DAILY_LOG'),
    { initialValue: {} as Record<string, string> },
  );

  private readonly _weekResource: ResourceRef<Result<DailyLog[]> | undefined> = resource({
    params: () => ({ userId: this.authService.userId() }),
    loader: ({ params }) => {
      const to = new Date();
      const from = new Date();
      from.setDate(from.getDate() - 6);
      return this.dailyLogsService.getDailyLogsForRange(
        params.userId,
        this.formatDate(from),
        this.formatDate(to),
      );
    },
  });

  readonly isLoading: Signal<boolean> = computed(() => this._weekResource.isLoading());

  readonly hasError: Signal<boolean> = computed(() => {
    const result = this._weekResource.value();
    return !!result && !result.success;
  });

  readonly entries: Signal<DailyLog[]> = computed(() => {
    const result = this._weekResource.value();
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
      { date: loggedDate, existingEntry },
    );
    if (!formData) {
      return;
    }
    await this.upsertLog(formData);
  }

  private async upsertLog(formData: LogEntryFormData): Promise<void> {
    const result: Result<DailyLog> = await this.dailyLogsService.upsertDailyLog({
      userId: this.authService.userId(),
      loggedDate: formData.loggedDate,
      sleepHours: formData.sleepHours,
      weightKg: formData.weightKg,
      waterLiters: formData.waterLiters,
      waistCm: formData.waistCm,
    });
    if (!result.success) {
      return;
    }
    this._weekResource.reload();
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
