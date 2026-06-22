import { computed, inject, resource, ResourceRef, Service, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../core/services/platform/auth.service';
import { DailyLogsService } from '../../core/services/data/daily-log.service';
import type { DailyLog } from '../../core/services/data/daily-log.service';
import type { Result } from '../../core/types/result';

@Service({ autoProvided: false })
export class DailyLogFacade {
  private readonly authService: AuthService = inject(AuthService);
  private readonly dailyLogsService: DailyLogsService = inject(DailyLogsService);
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

  async openLogDialog(loggedDate: string, existingEntry?: DailyLog): Promise<void> {}

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
