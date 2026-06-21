import { inject, Service, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { map } from 'rxjs';
import { AppRoute } from '../../core/enums/app-route.enum';
import { ProgressRoute } from '../../core/enums/progress-route.enum';

@Service({ autoProvided: false })
export class EntryFacade {
  private readonly router: Router = inject(Router);
  private readonly route: ActivatedRoute = inject(ActivatedRoute);
  private readonly translateService: TranslateService = inject(TranslateService);

  readonly translation: Signal<Record<string, string>> = toSignal(
    this.translateService.stream('ENTRY'),
    { initialValue: {} as Record<string, string> },
  );

  private readonly subjectIdParam: Signal<string | undefined> = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('subjectId') ?? undefined)),
  );

  readonly entryIdParam: Signal<string | undefined> = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('entryId') ?? undefined)),
  );

  navigateBack(): void {
    const subjectId = this.subjectIdParam();
    if (subjectId) {
      void this.router.navigate([AppRoute.Progress, ProgressRoute.Subject, subjectId]);
    } else {
      void this.router.navigate([AppRoute.Progress]);
    }
  }
}
