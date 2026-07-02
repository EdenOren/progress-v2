import {
  ChangeDetectionStrategy,
  Component,
  inject,
  output,
  OutputEmitterRef,
  Signal,
  signal,
  WritableSignal,
} from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { UiButtonComponent } from '../ui-button/ui-button.component';
import { UiInputComponent } from '../ui-input/ui-input.component';
import { UiModalComponent } from '../ui-modal/ui-modal.component';
import { UiTextareaComponent } from '../ui-textarea/ui-textarea.component';
import { ButtonVariant } from '../../enums/button-variant.enum';
import { InputType } from '../../enums/input-type.enum';

export interface CompleteSessionDialogData {
  exerciseCount: number;
  totalSets: number;
  elapsedMinutes: number;
}

export interface CompleteSessionResult {
  durationSeconds: number;
  notes: string;
}

@Component({
  selector: 'app-complete-session-dialog',
  templateUrl: './complete-session-dialog.component.html',
  styleUrl: './complete-session-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiModalComponent, UiButtonComponent, UiInputComponent, UiTextareaComponent],
})
export class CompleteSessionDialogComponent {
  private static readonly SECONDS_PER_MINUTE: number = 60;

  protected readonly data: CompleteSessionDialogData = inject<CompleteSessionDialogData>(MAT_DIALOG_DATA);
  private readonly translateService: TranslateService = inject(TranslateService);

  protected readonly buttonVariant: typeof ButtonVariant = ButtonVariant;
  protected readonly inputType: typeof InputType = InputType;

  readonly submitted: OutputEmitterRef<CompleteSessionResult> = output<CompleteSessionResult>();
  readonly closed: OutputEmitterRef<void> = output<void>();

  readonly translation: Signal<Record<string, string>> = toSignal(
    this.translateService.stream('ENTRY'),
    { initialValue: {} as Record<string, string> },
  );

  private readonly _durationMinutes: WritableSignal<number> = signal(this.data.elapsedMinutes);
  private readonly _notes: WritableSignal<string> = signal('');

  protected readonly durationMinutes: Signal<number> = this._durationMinutes;
  protected readonly notes: Signal<string> = this._notes;

  protected onDurationChange(value: number | null): void {
    this._durationMinutes.set(value === null ? 0 : Math.round(value));
  }

  protected onNotesChange(value: string): void {
    this._notes.set(value);
  }

  protected onSubmit(): void {
    this.submitted.emit({
      durationSeconds: this._durationMinutes() * CompleteSessionDialogComponent.SECONDS_PER_MINUTE,
      notes: this._notes(),
    });
  }

  protected onClose(): void {
    this.closed.emit();
  }
}
