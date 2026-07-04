import { ChangeDetectionStrategy, Component, computed, inject, Signal, signal, WritableSignal } from '@angular/core';
import { email, FieldTree, form, FormRoot, required } from '@angular/forms/signals';
import { ForgotPasswordFacade } from './forgot-password.facade';
import { AuthRoute } from '../../../core/enums/auth-route.enum';
import { ButtonType } from '../../../shared/enums/button-type.enum';
import { InputType } from '../../../shared/enums/input-type.enum';
import { ValidationKind } from '../../../shared/enums/validation-kind.enum';
import { UiButtonComponent } from '../../../shared/components/ui-button/ui-button.component';
import { UiInputComponent } from '../../../shared/components/ui-input/ui-input.component';
import { UiLinkComponent } from '../../../shared/components/ui-link/ui-link.component';

interface ForgotPasswordFormModel {
  email: string;
}

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ForgotPasswordFacade],
  imports: [FormRoot, UiInputComponent, UiButtonComponent, UiLinkComponent],
})
export class ForgotPasswordComponent {
  protected readonly facade: ForgotPasswordFacade = inject(ForgotPasswordFacade);

  protected readonly inputType: typeof InputType = InputType;
  protected readonly buttonType: typeof ButtonType = ButtonType;
  protected readonly authRoute: typeof AuthRoute = AuthRoute;

  private readonly _model: WritableSignal<ForgotPasswordFormModel> = signal({ email: '' });

  readonly forgotPasswordForm: FieldTree<ForgotPasswordFormModel> = form(this._model, (p) => {
    required(p.email);
    email(p.email);
  });

  readonly emailTouched: Signal<boolean> = computed(() => this.forgotPasswordForm.email().touched());

  readonly emailError: Signal<string> = computed(() => {
    const [error] = this.forgotPasswordForm.email().errors();
    if (!error) {
      return '';
    }
    const { kind } = error;
    if (kind === ValidationKind.Required) {
      return this.facade.validationTranslation()['REQUIRED'] ?? '';
    }
    if (kind === ValidationKind.Email) {
      return this.facade.validationTranslation()['EMAIL_FORMAT'] ?? '';
    }
    return '';
  });

  submit(): void {
    if (!this.forgotPasswordForm().valid()) {
      this.forgotPasswordForm().markAsTouched();
      return;
    }
    const { email: emailValue } = this._model();
    void this.facade.submitForgotPassword(emailValue);
  }
}
