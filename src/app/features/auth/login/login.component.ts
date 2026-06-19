import { ChangeDetectionStrategy, Component, computed, inject, Signal, signal, WritableSignal } from '@angular/core';
import {
  email,
  FieldTree,
  form,
  FormRoot,
  minLength,
  required,
} from '@angular/forms/signals';
import { LoginFacade } from './login.facade';
import { AuthRoute } from '../../../core/enums/auth-route.enum';
import { ButtonType } from '../../../shared/enums/button-type.enum';
import { ButtonVariant } from '../../../shared/enums/button-variant.enum';
import { InputType } from '../../../shared/enums/input-type.enum';
import { ValidationKind } from '../../../shared/enums/validation-kind.enum';
import { UiButtonComponent } from '../../../shared/components/ui-button/ui-button.component';
import { UiInputComponent } from '../../../shared/components/ui-input/ui-input.component';
import { UiLinkComponent } from '../../../shared/components/ui-link/ui-link.component';

interface LoginFormModel {
  email: string;
  password: string;
}

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [LoginFacade],
  imports: [FormRoot, UiInputComponent, UiButtonComponent, UiLinkComponent],
})
export class LoginComponent {
  private readonly facade: LoginFacade = inject(LoginFacade);

  protected readonly inputType: typeof InputType = InputType;
  protected readonly buttonType: typeof ButtonType = ButtonType;
  protected readonly buttonVariant: typeof ButtonVariant = ButtonVariant;
  protected readonly authRoute: typeof AuthRoute = AuthRoute;

  static readonly PASSWORD_MIN_LENGTH: number = 8;

  private readonly _model: WritableSignal<LoginFormModel> = signal({ email: '', password: '' });

  readonly loginForm: FieldTree<LoginFormModel> = form(this._model, (p) => {
    required(p.email);
    email(p.email);
    required(p.password);
    minLength(p.password, LoginComponent.PASSWORD_MIN_LENGTH);
  });

  readonly isEmailLoading: Signal<boolean> = this.facade.isEmailLoading;
  readonly isGoogleLoading: Signal<boolean> = this.facade.isGoogleLoading;
  readonly errorMessage: Signal<string> = this.facade.errorMessage;
  readonly submitLabel: Signal<string> = this.facade.submitLabel;
  readonly translation: Signal<Record<string, string>> = this.facade.translation;
  readonly validationTranslation: Signal<Record<string, string>> = this.facade.validationTranslation;

  readonly emailTouched: Signal<boolean> = computed(() => this.loginForm.email().touched());
  readonly passwordTouched: Signal<boolean> = computed(() => this.loginForm.password().touched());

  readonly emailError: Signal<string> = computed(() => {
    const [error] = this.loginForm.email().errors();
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
    const [error] = this.loginForm.password().errors();
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

  submit(): void {
    if (!this.loginForm().valid()) {
      this.loginForm().markAsTouched();
      return;
    }
    const { email: emailValue, password } = this._model();
    void this.facade.submitLogin(emailValue, password);
  }

  signInWithGoogle(): void {
    void this.facade.signInWithGoogle();
  }
}
