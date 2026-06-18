import { ChangeDetectionStrategy, Component, computed, input, InputSignal, Signal } from '@angular/core';
import { ButtonType } from '../../enums/button-type.enum';
import { ButtonVariant } from '../../enums/button-variant.enum';

@Component({
  selector: 'app-ui-button',
  templateUrl: './ui-button.component.html',
  styleUrl: './ui-button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiButtonComponent {
  readonly label: InputSignal<string> = input.required<string>();
  readonly type: InputSignal<ButtonType> = input<ButtonType>(ButtonType.Button);
  readonly isLoading: InputSignal<boolean> = input<boolean>(false);
  readonly variant: InputSignal<ButtonVariant> = input<ButtonVariant>(ButtonVariant.Primary);

  protected readonly isGoogle: Signal<boolean> = computed(
    () => this.variant() === ButtonVariant.Google,
  );
}
