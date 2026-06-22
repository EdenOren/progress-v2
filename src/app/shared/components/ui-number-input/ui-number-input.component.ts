import {
  ChangeDetectionStrategy,
  Component,
  input,
  InputSignal,
  output,
  OutputEmitterRef,
} from '@angular/core';

@Component({
  selector: 'app-ui-number-input',
  templateUrl: './ui-number-input.component.html',
  styleUrl: './ui-number-input.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiNumberInputComponent {
  readonly value: InputSignal<number | null> = input<number | null>(null);
  readonly min: InputSignal<number> = input<number>(0);
  readonly max: InputSignal<number | null> = input<number | null>(null);
  readonly step: InputSignal<number> = input<number>(1);
  readonly ariaLabel: InputSignal<string> = input.required<string>();
  readonly disabled: InputSignal<boolean> = input<boolean>(false);
  readonly compact: InputSignal<boolean> = input<boolean>(false);
  readonly placeholder: InputSignal<string> = input<string>('');
  readonly inputId: InputSignal<string> = input<string>('');

  readonly valueChange: OutputEmitterRef<number | null> = output<number | null>();

  protected onBlur(event: Event): void {
    const input = event.target as HTMLInputElement;
    const raw: number = parseFloat(input.value);

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
