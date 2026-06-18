import { ChangeDetectionStrategy, Component, input, InputSignal } from '@angular/core';
import { FormField } from '@angular/forms/signals';
import type { Field } from '@angular/forms/signals';
import { InputType } from '../../enums/input-type.enum';

@Component({
  selector: 'app-ui-input',
  templateUrl: './ui-input.component.html',
  styleUrl: './ui-input.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField],
})
export class UiInputComponent {
  readonly label: InputSignal<string> = input.required<string>();
  readonly inputId: InputSignal<string> = input.required<string>();
  readonly type: InputSignal<InputType> = input<InputType>(InputType.Text);
  readonly placeholder: InputSignal<string> = input<string>('');
  readonly autocomplete: InputSignal<string> = input<string>('off');
  readonly field: InputSignal<Field<string>> = input.required<Field<string>>();
  readonly error: InputSignal<string> = input<string>('');
  readonly touched: InputSignal<boolean> = input<boolean>(false);
}
