import {
  ChangeDetectionStrategy,
  Component,
  input,
  InputSignal,
  output,
  OutputEmitterRef,
} from '@angular/core';

@Component({
  selector: 'app-ui-textarea',
  templateUrl: './ui-textarea.component.html',
  styleUrl: './ui-textarea.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiTextareaComponent {
  readonly label: InputSignal<string> = input<string>('');
  readonly value: InputSignal<string> = input<string>('');
  readonly ariaLabel: InputSignal<string> = input.required<string>();
  readonly placeholder: InputSignal<string> = input<string>('');
  readonly rows: InputSignal<number> = input<number>(3);
  readonly inputId: InputSignal<string> = input<string>('');

  readonly blurred: OutputEmitterRef<string> = output<string>();

  protected onBlur(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    this.blurred.emit(textarea.value);
  }
}
