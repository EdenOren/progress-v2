import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  InputSignal,
  output,
  OutputEmitterRef,
  Signal,
  signal,
  WritableSignal,
} from '@angular/core';
import { FormField } from '@angular/forms/signals';
import type { Field } from '@angular/forms/signals';
import { InputType } from '../../enums/input-type.enum';
import { AppIcon } from '../../enums/app-icon.enum';
import { UiIconComponent } from '../ui-icon/ui-icon.component';

@Component({
  selector: 'app-ui-input',
  templateUrl: './ui-input.component.html',
  styleUrl: './ui-input.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, UiIconComponent],
  host: {
    '[class.ui-input--number]': 'isNumber()',
    '[class.ui-input--compact]': 'compact()',
  },
})
export class UiInputComponent {
  readonly label: InputSignal<string> = input<string>('');
  readonly inputId: InputSignal<string> = input<string>('');
  readonly type: InputSignal<InputType> = input<InputType>(InputType.Text);
  readonly placeholder: InputSignal<string> = input<string>('');
  readonly ariaLabel: InputSignal<string> = input<string>('');

  readonly field: InputSignal<Field<string> | null> = input<Field<string> | null>(null);
  readonly autocomplete: InputSignal<string> = input<string>('off');
  readonly error: InputSignal<string> = input<string>('');
  readonly touched: InputSignal<boolean> = input<boolean>(false);

  readonly value: InputSignal<number | null> = input<number | null>(null);
  readonly min: InputSignal<number> = input<number>(0);
  readonly max: InputSignal<number | null> = input<number | null>(null);
  readonly step: InputSignal<number> = input<number>(1);
  readonly disabled: InputSignal<boolean> = input<boolean>(false);
  readonly compact: InputSignal<boolean> = input<boolean>(false);

  readonly valueChange: OutputEmitterRef<number | null> = output<number | null>();

  protected readonly appIcon: typeof AppIcon = AppIcon;

  protected readonly isNumber: Signal<boolean> = computed(() => this.type() === InputType.Number);
  protected readonly isPassword: Signal<boolean> = computed(
    () => this.type() === InputType.Password,
  );

  private readonly _passwordVisible: WritableSignal<boolean> = signal(false);
  protected readonly passwordVisible: Signal<boolean> = computed(() => this._passwordVisible());

  protected readonly effectiveType: Signal<InputType> = computed(() => {
    if (this.isPassword() && this._passwordVisible()) {
      return InputType.Text;
    }
    return this.type();
  });

  protected togglePasswordVisibility(): void {
    this._passwordVisible.update((visible) => !visible);
  }

  protected onBlur(event: Event): void {
    const inputEl = event.target as HTMLInputElement;
    const raw: number = parseFloat(inputEl.value);

    if (isNaN(raw)) {
      this.valueChange.emit(null);
      return;
    }

    const clamped: number = this.clamp(raw);
    this.valueChange.emit(clamped);
  }

  private clamp(value: number): number {
    const minVal: number = this.min();
    const maxVal: number | null = this.max();
    const clamped: number = Math.max(value, minVal);

    if (maxVal !== null) {
      return Math.min(clamped, maxVal);
    }

    return clamped;
  }
}
