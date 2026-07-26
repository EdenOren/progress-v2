import { ButtonVariant, InputType, UiButtonComponent, UiInputComponent, UiModalComponent } from '@edenoren/ui-kit';
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
import { WeightUnit } from '../../enums/weight-unit.enum';
import {
  cmToIn,
  inToCm,
  kgToLb,
  lbToKg,
  roundToOneDecimal,
  WAIST_UNIT_LABELS,
  WEIGHT_UNIT_LABELS,
} from '../../utils/unit-conversion';
import type { DailyLog } from '../../../core/services/data/daily-log/daily-log.model';

export interface LogEntryDialogData {
  date: string;
  existingEntry?: DailyLog;
  weightUnit: WeightUnit;
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
  protected readonly weightUnit: WeightUnit = this.data.weightUnit;
  protected readonly weightUnitLabel: string = WEIGHT_UNIT_LABELS[this.weightUnit];
  protected readonly waistUnitLabel: string = WAIST_UNIT_LABELS[this.weightUnit];

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
  protected readonly waterLiters: Signal<number | null> = this._waterLiters;

  protected readonly weightDisplay: Signal<number | null> = computed(() => {
    const kg = this._weightKg();
    if (kg === null) {
      return null;
    }
    return this.weightUnit === WeightUnit.Lb ? roundToOneDecimal(kgToLb(kg)) : kg;
  });

  protected readonly waistDisplay: Signal<number | null> = computed(() => {
    const cm = this._waistCm();
    if (cm === null) {
      return null;
    }
    return this.weightUnit === WeightUnit.Lb ? roundToOneDecimal(cmToIn(cm)) : cm;
  });

  protected onSleepHoursChange(value: number | null): void {
    this._sleepHours.set(value);
  }

  protected onWeightChange(value: number | null): void {
    this._weightKg.set(
      value === null ? null : this.weightUnit === WeightUnit.Lb ? lbToKg(value) : value,
    );
  }

  protected onWaterLitersChange(value: number | null): void {
    this._waterLiters.set(value);
  }

  protected onWaistChange(value: number | null): void {
    this._waistCm.set(
      value === null ? null : this.weightUnit === WeightUnit.Lb ? inToCm(value) : value,
    );
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
