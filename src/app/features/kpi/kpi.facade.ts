import { computed, inject, resource, ResourceRef, Service, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../core/services/platform/auth.service';
import { EntriesService } from '../../core/services/data/entries.service';
import type { RecentEntry } from '../../core/services/data/entries.service';
import type { Result } from '../../core/types/result';
import { AppRoute } from '../../core/enums/app-route.enum';
import { ProgressRoute } from '../../core/enums/progress-route.enum';

@Service({ autoProvided: false })
export class KpiFacade {
  private static readonly RECENT_ENTRIES_LIMIT: number = 10;

  private readonly authService: AuthService = inject(AuthService);
  private readonly entriesService: EntriesService = inject(EntriesService);
  private readonly router: Router = inject(Router);
  private readonly translateService: TranslateService = inject(TranslateService);

  readonly translation: Signal<Record<string, string>> = toSignal(
    this.translateService.stream('KPI'),
    { initialValue: {} as Record<string, string> },
  );

  private readonly _recentEntriesResource: ResourceRef<Result<RecentEntry[]> | undefined> = resource({
    params: () => ({ userId: this.authService.userId() }),
    loader: ({ params }) =>
      this.entriesService.getRecentEntries(params.userId, KpiFacade.RECENT_ENTRIES_LIMIT),
  });

  readonly entries: Signal<RecentEntry[]> = computed(() => {
    const result = this._recentEntriesResource.value();
    if (!result?.success) {
      return [];
    }
    return result.data;
  });

  readonly isLoading: Signal<boolean> = computed(() => this._recentEntriesResource.isLoading());

  readonly hasError: Signal<boolean> = computed(() => {
    const result = this._recentEntriesResource.value();
    return !!result && !result.success;
  });

  readonly isEmpty: Signal<boolean> = computed(
    () => !this.isLoading() && !this.hasError() && !this.entries().length,
  );

  navigateToEntry(entry: RecentEntry): void {
    void this.router.navigate([
      AppRoute.Progress,
      ProgressRoute.Subject,
      entry.subjectId,
      ProgressRoute.Entry,
      entry.id,
    ]);
  }
}
