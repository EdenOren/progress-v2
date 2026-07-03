import {
  ChangeDetectionStrategy,
  Component,
  computed,
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
import { ButtonVariant } from '../../enums/button-variant.enum';
import { InputType } from '../../enums/input-type.enum';
import type { DailyLog } from '../../../core/services/data/daily-log/daily-log.model';

export interface LogEntryDialogData {
  date: string;
  existingEntry?: DailyLog;
}

export interface LogEntryFormData {
  loggedDate: string;
  sleepHours: number | null;
  weightKg: number | null;
  waterLiters: number | null;
  waistCm: number | null;
}

@Component({
  selector: 'app-log-entry-dialog',
  templateUrl: './log-entry-dialog.component.html',
  styleUrl: './log-entry-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiModalComponent, UiButtonComponent, UiInputComponent],
})
export class LogEntryDialogComponent {
  protected readonly data: LogEntryDialogData = inject<LogEntryDialogData>(MAT_DIALOG_DATA);
  private readonly translateService: TranslateService = inject(TranslateService);

  protected readonly inputType: typeof InputType = InputType;
  protected readonly buttonVariant: typeof ButtonVariant = ButtonVariant;

  readonly submitted: OutputEmitterRef<LogEntryFormData> = output<LogEntryFormData>();
  readonly closed: OutputEmitterRef<void> = output<void>();

  readonly translation: Signal<Record<string, string>> = toSignal(
    this.translateService.stream('DAILY_LOG.DIALOG'),
    { initialValue: {} as Record<string, string> },
  );

  readonly title: Signal<string> = computed(() => {
    const key = this.data.existingEntry ? 'TITLE_EDIT' : 'TITLE_CREATE';
    return this.translation()[key] ?? '';
  });

  private readonly _sleepHours: WritableSignal<number | null> = signal(
    this.data.existingEntry?.sleepHours ?? null,
  );
  private readonly _weightKg: WritableSignal<number | null> = signal(
    this.data.existingEntry?.weightKg ?? null,
  );
  private readonly _waterLiters: WritableSignal<number | null> = signal(
    this.data.existingEntry?.waterLiters ?? null,
  );
  private readonly _waistCm: WritableSignal<number | null> = signal(
    this.data.existingEntry?.waistCm ?? null,
  );

  protected readonly sleepHours: Signal<number | null> = this._sleepHours;
  protected readonly weightKg: Signal<number | null> = this._weightKg;
  protected readonly waterLiters: Signal<number | null> = this._waterLiters;
  protected readonly waistCm: Signal<number | null> = this._waistCm;

  protected onSleepHoursChange(value: number | null): void {
    this._sleepHours.set(value);
  }

  protected onWeightKgChange(value: number | null): void {
    this._weightKg.set(value);
  }

  protected onWaterLitersChange(value: number | null): void {
    this._waterLiters.set(value);
  }

  protected onWaistCmChange(value: number | null): void {
    this._waistCm.set(value);
  }

  protected onSubmit(): void {
    this.submitted.emit({
      loggedDate: this.data.date,
      sleepHours: this._sleepHours(),
      weightKg: this._weightKg(),
      waterLiters: this._waterLiters(),
      waistCm: this._waistCm(),
    });
  }

  protected onClose(): void {
    this.closed.emit();
  }
}
