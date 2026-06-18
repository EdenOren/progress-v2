import { inject, Service, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslateService } from '@ngx-translate/core';

@Service()
export class ValidationTranslationService {
  private readonly translateService: TranslateService = inject(TranslateService);

  readonly translation: Signal<Record<string, string>> = toSignal(
    this.translateService.stream('AUTH.VALIDATION'),
    { initialValue: {} as Record<string, string> },
  );
}
