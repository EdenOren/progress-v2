import { ValidationTranslationService } from '@edenoren/ui-kit';
import { computed, inject, Service, Signal, signal, WritableSignal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/platform/auth.service';
import { AppRoute } from '../../../core/enums/app-route.enum';
import { VerificationRequiredError } from '../../../core/errors/app-error';

@Service({ autoProvided: false })
export class SignupFacade {
  private readonly authService: AuthService = inject(AuthService);
  private readonly router: Router = inject(Router);
  private readonly translateService: TranslateService = inject(TranslateService);
  private readonly validationTranslationService: ValidationTranslationService = inject(ValidationTranslationService);

  private readonly _isLoading: WritableSignal<boolean> = signal(false);
  private readonly _errorMessage: WritableSignal<string> = signal('');
  private readonly _needsVerification: WritableSignal<boolean> = signal(false);

  readonly translation: Signal<Record<string, string>> = toSignal(
    this.translateService.stream('AUTH.SIGNUP'),
    { initialValue: {} as Record<string, string> },
  );
  readonly validationTranslation: Signal<Record<string, string>> = this.validationTranslationService.translation;

  readonly isLoading: Signal<boolean> = this._isLoading;
  readonly errorMessage: Signal<string> = this._errorMessage;
  readonly needsVerification: Signal<boolean> = this._needsVerification;

  readonly submitLabel: Signal<string> = computed(() =>
    this._isLoading()
      ? (this.translation()['LOADING'] ?? '')
      : (this.translation()['SUBMIT_BUTTON'] ?? ''),
  );

  async submitSignup(displayName: string, emailValue: string, password: string): Promise<void> {
    this._isLoading.set(true);
    this._errorMessage.set('');
    const result = await this.authService.signUpWithEmail(emailValue, password, displayName);
    if (result.success) {
      await this.router.navigate([AppRoute.Progress]);
    } else if (result.error instanceof VerificationRequiredError) {
      this._needsVerification.set(true);
    } else {
      this._errorMessage.set(result.error.message);
    }
    this._isLoading.set(false);
  }

  resetVerification(): void {
    this._needsVerification.set(false);
    this._errorMessage.set('');
  }
}
