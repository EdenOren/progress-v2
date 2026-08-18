import { computed, inject, Service, Signal, signal, WritableSignal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../core/services/platform/auth.service';
import { CurrentProfileService } from '../../core/services/data/profile/current-profile.service';
import type { Profile, UpdateProfileInput } from '../../core/services/data/profile/profile.model';
import type { Result } from '../../core/types/result';
import { AuthProvider } from '../../core/enums/auth-provider.enum';
import { SAVE_SUCCESS_DURATION_MS } from '../../shared/constants/feedback.const';

@Service({ autoProvided: false })
export class ProfileFacade {
  private readonly authService: AuthService = inject(AuthService);
  private readonly currentProfileService: CurrentProfileService = inject(CurrentProfileService);
  private readonly translateService: TranslateService = inject(TranslateService);

  readonly translation: Signal<Record<string, string>> = toSignal(
    this.translateService.stream('PROFILE'),
    { initialValue: {} as Record<string, string> },
  );

  readonly isLoading: Signal<boolean> = this.currentProfileService.isLoading;
  readonly hasError: Signal<boolean> = this.currentProfileService.hasError;
  readonly profile: Signal<Profile | null> = this.currentProfileService.profile;
  readonly displayName: Signal<string> = this.currentProfileService.displayName;
  readonly initial: Signal<string> = this.currentProfileService.initial;

  // The form is only worth a Save button once there is a form to save.
  readonly isReady: Signal<boolean> = computed(() => !this.isLoading() && !this.hasError());

  readonly email: Signal<string> = computed(() => this.authService.session()?.user.email ?? '');

  readonly memberSince: Signal<string> = computed(() => this.profile()?.createdAt ?? '');

  private readonly signInProvider: Signal<string> = computed(
    () => this.authService.session()?.user.app_metadata?.['provider'] ?? '',
  );

  readonly isPasswordAccount: Signal<boolean> = computed(
    () => this.signInProvider() === AuthProvider.Password,
  );

  readonly isGoogleAccount: Signal<boolean> = computed(
    () => this.signInProvider() === AuthProvider.Google,
  );

  private readonly _saveSuccess: WritableSignal<boolean> = signal(false);
  private readonly _saveError: WritableSignal<boolean> = signal(false);
  private readonly _isSaving: WritableSignal<boolean> = signal(false);

  readonly saveSuccess: Signal<boolean> = this._saveSuccess;
  readonly saveError: Signal<boolean> = this._saveError;
  readonly isSaving: Signal<boolean> = this._isSaving;

  private readonly _passwordEmailSent: WritableSignal<boolean> = signal(false);
  private readonly _passwordEmailError: WritableSignal<boolean> = signal(false);
  private readonly _isSendingPasswordEmail: WritableSignal<boolean> = signal(false);

  readonly passwordEmailSent: Signal<boolean> = this._passwordEmailSent;
  readonly passwordEmailError: Signal<boolean> = this._passwordEmailError;
  readonly isSendingPasswordEmail: Signal<boolean> = this._isSendingPasswordEmail;

  async saveProfile(input: UpdateProfileInput): Promise<boolean> {
    this._saveSuccess.set(false);
    this._saveError.set(false);
    this._isSaving.set(true);
    const result: Result<void> = await this.currentProfileService.save(input);
    this._isSaving.set(false);
    if (!result.success) {
      this._saveError.set(true);
      return false;
    }
    this._saveSuccess.set(true);
    setTimeout(() => this._saveSuccess.set(false), SAVE_SUCCESS_DURATION_MS);
    return true;
  }

  /**
   * Sends the reset link in place rather than linking to /auth/forgot-password,
   * which carries `guestGuard` and would bounce a signed-in user straight back.
   * The emailed link lands on /auth/reset-password, which has no guard.
   */
  async sendPasswordResetEmail(): Promise<void> {
    const email: string = this.email();
    if (!email) {
      return;
    }
    this._passwordEmailSent.set(false);
    this._passwordEmailError.set(false);
    this._isSendingPasswordEmail.set(true);
    const result: Result<void> = await this.authService.resetPasswordForEmail(email);
    this._isSendingPasswordEmail.set(false);
    if (!result.success) {
      this._passwordEmailError.set(true);
      return;
    }
    this._passwordEmailSent.set(true);
  }
}
