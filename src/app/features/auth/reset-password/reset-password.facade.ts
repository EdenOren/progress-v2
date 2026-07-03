import { computed, inject, Service, Signal, signal, WritableSignal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/platform/auth.service';
import { AppRoute } from '../../../core/enums/app-route.enum';
import { ValidationTranslationService } from '../../../shared/services/validation-translation.service';

@Service({ autoProvided: false })
export class ResetPasswordFacade {
  private readonly authService: AuthService = inject(AuthService);
  private readonly router: Router = inject(Router);
  private readonly translateService: TranslateService = inject(TranslateService);
  private readonly validationTranslationService: ValidationTranslationService = inject(ValidationTranslationService);

  private readonly _isLoading: WritableSignal<boolean> = signal(false);
  private readonly _errorMessage: WritableSignal<string> = signal('');
  private readonly _ready: WritableSignal<boolean> = signal(false);

  readonly translation: Signal<Record<string, string>> = toSignal(
    this.translateService.stream('AUTH.RESET_PASSWORD'),
    { initialValue: {} as Record<string, string> },
  );
  readonly validationTranslation: Signal<Record<string, string>> = this.validationTranslationService.translation;

  readonly isLoading: Signal<boolean> = this._isLoading;
  readonly errorMessage: Signal<string> = this._errorMessage;
  readonly ready: Signal<boolean> = this._ready;
  readonly canReset: Signal<boolean> = computed(() => this.authService.isAuthenticated());

  readonly submitLabel: Signal<string> = computed(() =>
    this._isLoading()
      ? (this.translation()['LOADING'] ?? '')
      : (this.translation()['SUBMIT_BUTTON'] ?? ''),
  );

  constructor() {
    void this.authService.initialized.then(() => this._ready.set(true));
  }

  async submitReset(password: string): Promise<void> {
    this._isLoading.set(true);
    this._errorMessage.set('');
    const result = await this.authService.updateUserPassword(password);
    if (result.success) {
      await this.router.navigate([AppRoute.Progress]);
    } else {
      this._errorMessage.set(result.error.message);
    }
    this._isLoading.set(false);
  }
}
