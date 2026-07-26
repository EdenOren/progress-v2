import { ValidationTranslationService } from '@edenoren/ui-kit';
import { computed, inject, Service, Signal, signal, WritableSignal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/platform/auth.service';

@Service({ autoProvided: false })
export class ForgotPasswordFacade {
  private readonly authService: AuthService = inject(AuthService);
  private readonly translateService: TranslateService = inject(TranslateService);
  private readonly validationTranslationService: ValidationTranslationService = inject(ValidationTranslationService);

  private readonly _isLoading: WritableSignal<boolean> = signal(false);
  private readonly _errorMessage: WritableSignal<string> = signal('');
  private readonly _submitSuccess: WritableSignal<boolean> = signal(false);

  readonly translation: Signal<Record<string, string>> = toSignal(
    this.translateService.stream('AUTH.FORGOT_PASSWORD'),
    { initialValue: {} as Record<string, string> },
  );
  readonly validationTranslation: Signal<Record<string, string>> = this.validationTranslationService.translation;

  readonly isLoading: Signal<boolean> = this._isLoading;
  readonly errorMessage: Signal<string> = this._errorMessage;
  readonly submitSuccess: Signal<boolean> = this._submitSuccess;

  readonly submitLabel: Signal<string> = computed(() =>
    this._isLoading()
      ? (this.translation()['LOADING'] ?? '')
      : (this.translation()['SUBMIT_BUTTON'] ?? ''),
  );

  async submitForgotPassword(emailValue: string): Promise<void> {
    this._isLoading.set(true);
    this._errorMessage.set('');
    const result = await this.authService.resetPasswordForEmail(emailValue);
    if (!result.success) {
      this._errorMessage.set(result.error.message);
    } else {
      this._submitSuccess.set(true);
    }
    this._isLoading.set(false);
  }
}
