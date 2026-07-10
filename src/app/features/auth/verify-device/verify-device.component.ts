import { ChangeDetectionStrategy, Component, computed, inject, Signal, signal, WritableSignal } from '@angular/core';
import { FieldTree, form, FormRoot, minLength, required } from '@angular/forms/signals';
import { VerifyDeviceFacade } from './verify-device.facade';
import { AuthRoute } from '../../../core/enums/auth-route.enum';
import { ButtonType } from '../../../shared/enums/button-type.enum';
import { ButtonVariant } from '../../../shared/enums/button-variant.enum';
import { InputType } from '../../../shared/enums/input-type.enum';
import { ValidationKind } from '../../../shared/enums/validation-kind.enum';
import { UiButtonComponent } from '../../../shared/components/ui-button/ui-button.component';
import { UiInputComponent } from '../../../shared/components/ui-input/ui-input.component';
import { UiLinkComponent } from '../../../shared/components/ui-link/ui-link.component';

interface VerifyDeviceFormModel {
  code: string;
}

@Component({
  selector: 'app-verify-device',
  templateUrl: './verify-device.component.html',
  styleUrl: './verify-device.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [VerifyDeviceFacade],
  imports: [FormRoot, UiInputComponent, UiButtonComponent, UiLinkComponent],
})
export class VerifyDeviceComponent {
  protected readonly facade: VerifyDeviceFacade = inject(VerifyDeviceFacade);

  protected readonly inputType: typeof InputType = InputType;
  protected readonly buttonType: typeof ButtonType = ButtonType;
  protected readonly buttonVariant: typeof ButtonVariant = ButtonVariant;
  protected readonly authRoute: typeof AuthRoute = AuthRoute;

  static readonly CODE_LENGTH: number = 6;

  private readonly _model: WritableSignal<VerifyDeviceFormModel> = signal({ code: '' });

  readonly verifyDeviceForm: FieldTree<VerifyDeviceFormModel> = form(this._model, (p) => {
    required(p.code);
    minLength(p.code, VerifyDeviceComponent.CODE_LENGTH);
  });

  readonly codeTouched: Signal<boolean> = computed(() => this.verifyDeviceForm.code().touched());

  readonly codeError: Signal<string> = computed(() => {
    const [error] = this.verifyDeviceForm.code().errors();
    if (!error) {
      return '';
    }
    const { kind } = error;
    if (kind === ValidationKind.Required) {
      return this.facade.validationTranslation()['REQUIRED'] ?? '';
    }
    if (kind === ValidationKind.MinLength) {
      return this.facade.translation()['CODE_LENGTH_ERROR'] ?? '';
    }
    return '';
  });

  submit(): void {
    if (!this.verifyDeviceForm().valid()) {
      this.verifyDeviceForm().markAsTouched();
      return;
    }
    const { code } = this._model();
    void this.facade.submitCode(code);
  }

  resend(): void {
    void this.facade.resendCode();
  }
}
