import { ButtonType, InputType, UiButtonComponent, UiInputComponent, UiLinkComponent, ValidationKind } from '@edenoren/ui-kit';
import { ChangeDetectionStrategy, Component, computed, inject, Signal, signal, WritableSignal } from '@angular/core';
import { FieldTree, form, FormRoot, minLength, required } from '@angular/forms/signals';
import { ResetPasswordFacade } from './reset-password.facade';
import { AuthRoute } from '../../../core/enums/auth-route.enum';

interface ResetPasswordFormModel {
  password: string;
  confirmPassword: string;
}

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ResetPasswordFacade],
  imports: [FormRoot, UiInputComponent, UiButtonComponent, UiLinkComponent],
})
export class ResetPasswordComponent {
  protected readonly facade: ResetPasswordFacade = inject(ResetPasswordFacade);

  protected readonly inputType: typeof InputType = InputType;
  protected readonly buttonType: typeof ButtonType = ButtonType;
  protected readonly authRoute: typeof AuthRoute = AuthRoute;

  static readonly PASSWORD_MIN_LENGTH: number = 8;

  private readonly _model: WritableSignal<ResetPasswordFormModel> = signal({
    password: '',
    confirmPassword: '',
  });

  private readonly _passwordsMismatch: WritableSignal<boolean> = signal(false);

  readonly resetPasswordForm: FieldTree<ResetPasswordFormModel> = form(this._model, (p) => {
    required(p.password);
    minLength(p.password, ResetPasswordComponent.PASSWORD_MIN_LENGTH);
    required(p.confirmPassword);
  });

  readonly passwordTouched: Signal<boolean> = computed(() => this.resetPasswordForm.password().touched());
  readonly confirmPasswordTouched: Signal<boolean> = computed(() =>
    this.resetPasswordForm.confirmPassword().touched(),
  );

  readonly passwordError: Signal<string> = computed(() => {
    const [error] = this.resetPasswordForm.password().errors();
    if (!error) {
      return '';
    }
    const { kind } = error;
    if (kind === ValidationKind.Required) {
      return this.facade.validationTranslation()['REQUIRED'] ?? '';
    }
    if (kind === ValidationKind.MinLength) {
      return this.facade.validationTranslation()['PASSWORD_MIN_LENGTH'] ?? '';
    }
    return '';
  });

  readonly confirmPasswordError: Signal<string> = computed(() => {
    if (this._passwordsMismatch()) {
      return this.facade.validationTranslation()['PASSWORDS_MUST_MATCH'] ?? '';
    }
    const [error] = this.resetPasswordForm.confirmPassword().errors();
    if (!error) {
      return '';
    }
    const { kind } = error;
    if (kind === ValidationKind.Required) {
      return this.facade.validationTranslation()['REQUIRED'] ?? '';
    }
    return '';
  });

  submit(): void {
    this._passwordsMismatch.set(false);
    if (!this.resetPasswordForm().valid()) {
      this.resetPasswordForm().markAsTouched();
      return;
    }
    const { password, confirmPassword } = this._model();
    if (password !== confirmPassword) {
      this.resetPasswordForm().markAsTouched();
      this._passwordsMismatch.set(true);
      return;
    }
    void this.facade.submitReset(password);
  }
}
