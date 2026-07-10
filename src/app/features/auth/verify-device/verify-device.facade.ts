import { computed, effect, inject, Service, Signal, signal, WritableSignal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/platform/auth.service';
import { AppRoute } from '../../../core/enums/app-route.enum';
import { ValidationTranslationService } from '../../../shared/services/validation-translation.service';

@Service({ autoProvided: false })
export class VerifyDeviceFacade {
  private static readonly RESEND_COOLDOWN_SECONDS: number = 60;
  private static readonly COOLDOWN_TICK_MS: number = 1000;

  private readonly authService: AuthService = inject(AuthService);
  private readonly router: Router = inject(Router);
  private readonly translateService: TranslateService = inject(TranslateService);
  private readonly validationTranslationService: ValidationTranslationService = inject(ValidationTranslationService);

  private readonly _isLoading: WritableSignal<boolean> = signal(false);
  private readonly _isResending: WritableSignal<boolean> = signal(false);
  private readonly _errorMessage: WritableSignal<string> = signal('');
  private readonly _resendCooldownSeconds: WritableSignal<number> = signal(
    VerifyDeviceFacade.RESEND_COOLDOWN_SECONDS,
  );

  readonly translation: Signal<Record<string, string>> = toSignal(
    this.translateService.stream('AUTH.VERIFY_DEVICE'),
    { initialValue: {} as Record<string, string> },
  );
  readonly validationTranslation: Signal<Record<string, string>> = this.validationTranslationService.translation;

  readonly isLoading: Signal<boolean> = this._isLoading;
  readonly isResending: Signal<boolean> = this._isResending;
  readonly errorMessage: Signal<string> = this._errorMessage;
  readonly canResend: Signal<boolean> = computed(
    () => this._resendCooldownSeconds() === 0 && !this._isResending(),
  );

  readonly submitLabel: Signal<string> = computed(() =>
    this._isLoading()
      ? (this.translation()['LOADING'] ?? '')
      : (this.translation()['SUBMIT_BUTTON'] ?? ''),
  );

  readonly resendLabel: Signal<string> = computed(() => {
    const cooldownSeconds = this._resendCooldownSeconds();
    if (cooldownSeconds > 0) {
      return `${this.translation()['RESEND_COOLDOWN_LABEL'] ?? ''} ${cooldownSeconds}s`;
    }
    return this.translation()['RESEND_BUTTON'] ?? '';
  });

  constructor() {
    effect((onCleanup) => {
      const tick = setInterval(() => {
        this._resendCooldownSeconds.update((seconds) => Math.max(0, seconds - 1));
      }, VerifyDeviceFacade.COOLDOWN_TICK_MS);
      onCleanup(() => clearInterval(tick));
    });
  }

  async submitCode(code: string): Promise<void> {
    this._isLoading.set(true);
    this._errorMessage.set('');
    const result = await this.authService.verifyDeviceOtp(code);
    if (result.success) {
      await this.router.navigate([AppRoute.Progress]);
    } else {
      this._errorMessage.set(result.error.message);
    }
    this._isLoading.set(false);
  }

  async resendCode(): Promise<void> {
    this._isResending.set(true);
    this._errorMessage.set('');
    const result = await this.authService.resendDeviceOtp();
    if (result.success) {
      this._resendCooldownSeconds.set(VerifyDeviceFacade.RESEND_COOLDOWN_SECONDS);
    } else {
      this._errorMessage.set(result.error.message);
    }
    this._isResending.set(false);
  }
}
