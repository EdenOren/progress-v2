import { ChangeDetectionStrategy, Component, input, InputSignal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ButtonType } from '../../enums/button-type.enum';
import { ButtonVariant } from '../../enums/button-variant.enum';
import { ButtonSize } from '../../enums/button-size.enum';

@Component({
  selector: 'app-ui-button',
  templateUrl: './ui-button.component.html',
  styleUrl: './ui-button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule],
})
export class UiButtonComponent {
  readonly label: InputSignal<string> = input.required<string>();
  readonly type: InputSignal<ButtonType> = input<ButtonType>(ButtonType.Button);
  readonly isLoading: InputSignal<boolean> = input<boolean>(false);
  readonly disabled: InputSignal<boolean> = input<boolean>(false);
  readonly variant: InputSignal<ButtonVariant> = input<ButtonVariant>(ButtonVariant.Primary);
  readonly size: InputSignal<ButtonSize> = input<ButtonSize>(ButtonSize.Md);
  readonly icon: InputSignal<string> = input<string>('');
  readonly color: InputSignal<string> = input<string>('');
  readonly iconOnly: InputSignal<boolean> = input<boolean>(false);

  protected readonly buttonVariant: typeof ButtonVariant = ButtonVariant;
  protected readonly buttonSize: typeof ButtonSize = ButtonSize;
}
