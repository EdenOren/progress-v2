import {
  ChangeDetectionStrategy,
  Component,
  inject,
  Signal,
  signal,
  WritableSignal,
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { UiButtonComponent } from '../../../../shared/components/ui-button/ui-button.component';
import { UiModalComponent } from '../../../../shared/components/ui-modal/ui-modal.component';
import { UiNumberInputComponent } from '../../../../shared/components/ui-number-input/ui-number-input.component';
import { UiTextareaComponent } from '../../../../shared/components/ui-textarea/ui-textarea.component';
import { ButtonVariant } from '../../../../shared/enums/button-variant.enum';

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
  imports: [UiModalComponent, UiButtonComponent, UiNumberInputComponent, UiTextareaComponent],
})
export class CompleteSessionDialogComponent {
  static readonly DIALOG_WIDTH: string = '360px';
  private static readonly SECONDS_PER_MINUTE: number = 60;

  protected readonly data: CompleteSessionDialogData = inject<CompleteSessionDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef: MatDialogRef<CompleteSessionDialogComponent, CompleteSessionResult> =
    inject(MatDialogRef<CompleteSessionDialogComponent, CompleteSessionResult>);
  private readonly translateService: TranslateService = inject(TranslateService);

  protected readonly buttonVariant: typeof ButtonVariant = ButtonVariant;

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

  protected confirm(): void {
    this.dialogRef.close({
      durationSeconds: this._durationMinutes() * CompleteSessionDialogComponent.SECONDS_PER_MINUTE,
      notes: this._notes(),
    });
  }

  protected cancel(): void {
    this.dialogRef.close(undefined);
  }
}
