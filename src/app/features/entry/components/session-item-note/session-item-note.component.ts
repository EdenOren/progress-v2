import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  InputSignal,
  output,
  OutputEmitterRef,
  signal,
  Signal,
  WritableSignal,
} from '@angular/core';
import { UiTextareaComponent } from '../../../../shared/components/ui-textarea/ui-textarea.component';
import { ButtonType } from '../../../../shared/enums/button-type.enum';

@Component({
  selector: 'app-session-item-note',
  templateUrl: './session-item-note.component.html',
  styleUrl: './session-item-note.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiTextareaComponent],
})
export class SessionItemNoteComponent {
  readonly note: InputSignal<string | null> = input<string | null>(null);
  readonly isReadOnly: InputSignal<boolean> = input<boolean>(false);
  readonly translation: InputSignal<Record<string, string>> = input.required<Record<string, string>>();

  readonly noteChanged: OutputEmitterRef<string> = output<string>();

  protected readonly ButtonType: typeof ButtonType = ButtonType;

  private readonly _noteExpanded: WritableSignal<boolean> = signal(false);
  readonly noteExpanded: Signal<boolean> = computed(() => this._noteExpanded());

  protected expandNote(): void {
    this._noteExpanded.set(true);
  }

  protected onNoteChange(value: string): void {
    this.noteChanged.emit(value);
  }
}
