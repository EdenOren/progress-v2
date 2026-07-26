import { ButtonVariant, UiButtonComponent } from '@edenoren/ui-kit';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  InputSignal,
  output,
  OutputEmitterRef,
  Signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { WeightUnit } from '../../../../shared/enums/weight-unit.enum';
import {
  cmToIn,
  kgToLb,
  roundToOneDecimal,
  WAIST_UNIT_LABELS,
  WEIGHT_UNIT_LABELS,
} from '../../../../shared/utils/unit-conversion';
import type { DailyLog } from '../../../../core/services/data/daily-log/daily-log.model';

@Component({
  selector: 'app-log-card',
  templateUrl: './log-card.component.html',
  styleUrl: './log-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, UiButtonComponent, MatIconModule],
})
export class LogCardComponent {
  readonly entry: InputSignal<DailyLog> = input.required<DailyLog>();
  readonly translation: InputSignal<Record<string, string>> = input.required<Record<string, string>>();
  readonly weightUnit: InputSignal<WeightUnit> = input<WeightUnit>(WeightUnit.Kg);
  readonly editClicked: OutputEmitterRef<DailyLog> = output<DailyLog>();

  protected readonly buttonVariant: typeof ButtonVariant = ButtonVariant;

  protected readonly weightLabel: Signal<string> = computed(
    () => WEIGHT_UNIT_LABELS[this.weightUnit()],
  );

  protected readonly waistLabel: Signal<string> = computed(
    () => WAIST_UNIT_LABELS[this.weightUnit()],
  );

  protected readonly displayWeight: Signal<number | null> = computed(() => {
    const kg = this.entry().weightKg;
    if (kg === null) {
      return null;
    }
    return this.weightUnit() === WeightUnit.Lb ? roundToOneDecimal(kgToLb(kg)) : kg;
  });

  protected readonly displayWaist: Signal<number | null> = computed(() => {
    const cm = this.entry().waistCm;
    if (cm === null) {
      return null;
    }
    return this.weightUnit() === WeightUnit.Lb ? roundToOneDecimal(cmToIn(cm)) : cm;
  });

  protected onEdit(): void {
    this.editClicked.emit(this.entry());
  }
}
