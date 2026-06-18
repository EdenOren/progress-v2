import { computed, inject, Service, Signal, signal, WritableSignal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/platform/auth.service';
import { AppRoute } from '../../../core/enums/app-route.enum';
import { ValidationTranslationService } from '../../../shared/services/validation-translation.service';

@Service({ autoProvided: false })
export class LoginFacade {
  private readonly authService: AuthService = inject(AuthService);
  private readonly router: Router = inject(Router);
  private readonly translateService: TranslateService = inject(TranslateService);
  private readonly validationTranslationService: ValidationTranslationService = inject(ValidationTranslationService);

  private readonly _isEmailLoading: WritableSignal<boolean> = signal(false);
  private readonly _isGoogleLoading: WritableSignal<boolean> = signal(false);
  private readonly _errorMessage: WritableSignal<string> = signal('');

  readonly translation: Signal<Record<string, string>> = toSignal(
    this.translateService.stream('AUTH.LOGIN'),
    { initialValue: {} as Record<string, string> },
  );
  readonly validationTranslation: Signal<Record<string, string>> = this.validationTranslationService.translation;

  readonly isEmailLoading: Signal<boolean> = this._isEmailLoading;
  readonly isGoogleLoading: Signal<boolean> = this._isGoogleLoading;
  readonly errorMessage: Signal<string> = this._errorMessage;

  readonly submitLabel: Signal<string> = computed(() =>
    this._isEmailLoading()
      ? (this.translation()['LOADING'] ?? '')
      : (this.translation()['SUBMIT_BUTTON'] ?? ''),
  );

  async submitLogin(emailValue: string, password: string): Promise<void> {
    this._isEmailLoading.set(true);
    this._errorMessage.set('');
    const result = await this.authService.signInWithEmail(emailValue, password);
    if (result.success) {
      await this.router.navigate([AppRoute.Progress]);
    } else {
      this._errorMessage.set(result.error.message);
    }
    this._isEmailLoading.set(false);
  }

  async signInWithGoogle(): Promise<void> {
    this._isGoogleLoading.set(true);
    this._errorMessage.set('');
    const result = await this.authService.signInWithGoogle();
    if (!result.success) {
      this._errorMessage.set(result.error.message);
    }
    this._isGoogleLoading.set(false);
  }
}
