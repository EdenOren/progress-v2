import { ChangeDetectionStrategy, Component, computed, inject, Signal, signal, WritableSignal } from '@angular/core';
import {
  email,
  FieldTree,
  form,
  FormRoot,
  minLength,
  required,
} from '@angular/forms/signals';
import { SignupFacade } from './signup.facade';
import { AuthRoute } from '../../../core/enums/auth-route.enum';
import { ButtonType } from '../../../shared/enums/button-type.enum';
import { InputType } from '../../../shared/enums/input-type.enum';
import { ValidationKind } from '../../../shared/enums/validation-kind.enum';
import { UiButtonComponent } from '../../../shared/components/ui-button/ui-button.component';
import { UiInputComponent } from '../../../shared/components/ui-input/ui-input.component';
import { UiLinkComponent } from '../../../shared/components/ui-link/ui-link.component';

interface SignupFormModel {
  displayName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [SignupFacade],
  imports: [FormRoot, UiInputComponent, UiButtonComponent, UiLinkComponent],
})
export class SignupComponent {
  private readonly facade: SignupFacade = inject(SignupFacade);

  protected readonly InputType: typeof InputType = InputType;
  protected readonly ButtonType: typeof ButtonType = ButtonType;
  protected readonly AuthRoute: typeof AuthRoute = AuthRoute;

  static readonly DISPLAY_NAME_MIN_LENGTH: number = 2;
  static readonly PASSWORD_MIN_LENGTH: number = 8;

  private readonly _model: WritableSignal<SignupFormModel> = signal({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  private readonly _passwordsMismatch: WritableSignal<boolean> = signal(false);

  readonly signupForm: FieldTree<SignupFormModel> = form(this._model, (p) => {
    required(p.displayName);
    minLength(p.displayName, SignupComponent.DISPLAY_NAME_MIN_LENGTH);
    required(p.email);
    email(p.email);
    required(p.password);
    minLength(p.password, SignupComponent.PASSWORD_MIN_LENGTH);
    required(p.confirmPassword);
  });

  readonly isLoading: Signal<boolean> = this.facade.isLoading;
  readonly errorMessage: Signal<string> = this.facade.errorMessage;
  readonly needsVerification: Signal<boolean> = this.facade.needsVerification;
  readonly submitLabel: Signal<string> = this.facade.submitLabel;
  readonly translation: Signal<Record<string, string>> = this.facade.translation;
  readonly validationTranslation: Signal<Record<string, string>> = this.facade.validationTranslation;

  readonly displayNameTouched: Signal<boolean> = computed(() => this.signupForm.displayName().touched());
  readonly emailTouched: Signal<boolean> = computed(() => this.signupForm.email().touched());
  readonly passwordTouched: Signal<boolean> = computed(() => this.signupForm.password().touched());
  readonly confirmPasswordTouched: Signal<boolean> = computed(() => this.signupForm.confirmPassword().touched());

  readonly displayNameError: Signal<string> = computed(() => {
    const [error] = this.signupForm.displayName().errors();
    if (!error) {
      return '';
    }
    const { kind } = error;
    if (kind === ValidationKind.Required) {
      return this.validationTranslation()['REQUIRED'] ?? '';
    }
    if (kind === ValidationKind.MinLength) {
      return this.validationTranslation()['DISPLAY_NAME_MIN_LENGTH'] ?? '';
    }
    return '';
  });

  readonly emailError: Signal<string> = computed(() => {
    const [error] = this.signupForm.email().errors();
    if (!error) {
      return '';
    }
    const { kind } = error;
    if (kind === ValidationKind.Required) {
      return this.validationTranslation()['REQUIRED'] ?? '';
    }
    if (kind === ValidationKind.Email) {
      return this.validationTranslation()['EMAIL_FORMAT'] ?? '';
    }
    return '';
  });

  readonly passwordError: Signal<string> = computed(() => {
    const [error] = this.signupForm.password().errors();
    if (!error) {
      return '';
    }
    const { kind } = error;
    if (kind === ValidationKind.Required) {
      return this.validationTranslation()['REQUIRED'] ?? '';
    }
    if (kind === ValidationKind.MinLength) {
      return this.validationTranslation()['PASSWORD_MIN_LENGTH'] ?? '';
    }
    return '';
  });

  readonly confirmPasswordError: Signal<string> = computed(() => {
    if (this._passwordsMismatch()) {
      return this.validationTranslation()['PASSWORDS_MUST_MATCH'] ?? '';
    }
    const [error] = this.signupForm.confirmPassword().errors();
    if (!error) {
      return '';
    }
    const { kind } = error;
    if (kind === ValidationKind.Required) {
      return this.validationTranslation()['REQUIRED'] ?? '';
    }
    return '';
  });

  submit(): void {
    this._passwordsMismatch.set(false);
    if (!this.signupForm().valid()) {
      this.signupForm().markAsTouched();
      return;
    }
    const { displayName, email: emailValue, password, confirmPassword } = this._model();
    if (password !== confirmPassword) {
      this.signupForm().markAsTouched();
      this._passwordsMismatch.set(true);
      return;
    }
    void this.facade.submitSignup(displayName, emailValue, password);
  }

  resetVerification(): void {
    this.facade.resetVerification();
  }
}
