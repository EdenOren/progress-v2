import { ButtonVariant, UiButtonComponent, UiStatTileComponent } from '@edenoren/ui-kit';
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
import { WeightUnit } from '../../../../shared/enums/weight-unit.enum';
import { LogMetricKey } from '../../enums/log-metric-key.enum';
import {
  cmToIn,
  kgToLb,
  roundToOneDecimal,
  WAIST_UNIT_LABELS,
  WEIGHT_UNIT_LABELS,
} from '../../../../shared/utils/unit-conversion';
import type { DailyLog } from '../../../../core/services/data/daily-log/daily-log.model';
import { AppIcon } from '../../../../shared/enums/app-icon.enum';

export interface LogMetric {
  readonly key: LogMetricKey;
  readonly label: string;
  readonly value: string;
  readonly unit: string;
}

@Component({
  selector: 'app-log-card',
  templateUrl: './log-card.component.html',
  styleUrl: './log-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, UiButtonComponent, UiStatTileComponent],
})
export class LogCardComponent {
  protected readonly appIcon: typeof AppIcon = AppIcon;
  private static readonly MISSING_VALUE: string = '—';

  readonly entry: InputSignal<DailyLog> = input.required<DailyLog>();
  readonly translation: InputSignal<Record<string, string>> = input.required<Record<string, string>>();
  readonly weightUnit: InputSignal<WeightUnit> = input<WeightUnit>(WeightUnit.Kg);
  readonly editClicked: OutputEmitterRef<DailyLog> = output<DailyLog>();

  protected readonly buttonVariant: typeof ButtonVariant = ButtonVariant;

  private readonly weightLabel: Signal<string> = computed(
    () => WEIGHT_UNIT_LABELS[this.weightUnit()],
  );

  private readonly waistLabel: Signal<string> = computed(
    () => WAIST_UNIT_LABELS[this.weightUnit()],
  );

  private readonly displayWeight: Signal<number | null> = computed(() => {
    const kilograms: number | null = this.entry().weightKg;
    if (kilograms === null) {
      return null;
    }
    return this.weightUnit() === WeightUnit.Lb ? roundToOneDecimal(kgToLb(kilograms)) : kilograms;
  });

  private readonly displayWaist: Signal<number | null> = computed(() => {
    const centimetres: number | null = this.entry().waistCm;
    if (centimetres === null) {
      return null;
    }
    return this.weightUnit() === WeightUnit.Lb
      ? roundToOneDecimal(cmToIn(centimetres))
      : centimetres;
  });

  // Every metric renders every day, unlogged ones included. A gap costs one
  // dash; dropping the tile would shift its neighbours left and destroy the
  // column, which is the only way to read a week of weights at a glance.
  protected readonly metrics: Signal<LogMetric[]> = computed(() => {
    const labels: Record<string, string> = this.translation();
    const candidates: ReadonlyArray<{ key: LogMetricKey; amount: number | null; label: string; unit: string }> = [
      {
        key: LogMetricKey.Sleep,
        amount: this.entry().sleepHours,
        label: labels['SLEEP'] ?? '',
        unit: labels['SLEEP_UNIT'] ?? '',
      },
      {
        key: LogMetricKey.Weight,
        amount: this.displayWeight(),
        label: labels['WEIGHT'] ?? '',
        unit: this.weightLabel(),
      },
      {
        key: LogMetricKey.Water,
        amount: this.entry().waterLiters,
        label: labels['WATER'] ?? '',
        unit: labels['WATER_UNIT'] ?? '',
      },
      {
        key: LogMetricKey.Waist,
        amount: this.displayWaist(),
        label: labels['WAIST'] ?? '',
        unit: this.waistLabel(),
      },
    ];
    return candidates.map((candidate) => ({
      key: candidate.key,
      label: candidate.label,
      value: candidate.amount === null ? LogCardComponent.MISSING_VALUE : String(candidate.amount),
      unit: candidate.amount === null ? '' : candidate.unit,
    }));
  });

  protected onEdit(): void {
    this.editClicked.emit(this.entry());
  }
}
