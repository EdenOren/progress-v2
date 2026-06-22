import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  InputSignal,
  linkedSignal,
  output,
  OutputEmitterRef,
  Signal,
  WritableSignal,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { UiNumberInputComponent } from '../../../../shared/components/ui-number-input/ui-number-input.component';
import { TrackingType } from '../../../../shared/enums/tracking-type.enum';
import { ButtonType } from '../../../../shared/enums/button-type.enum';
import { DistanceUnit } from '../../../../shared/enums/distance-unit.enum';
import {
  metersToKm,
  metersToMiles,
  metersToYards,
  kmToMeters,
  milesToMeters,
  yardsToMeters,
} from '../../../../shared/utils/unit-conversion';
import type { ItemSet } from '../../../../core/services/data/items.service';
import type { SetChangedPayload } from '../../../../core/services/data/item-sets.service';

@Component({
  selector: 'app-set-row',
  templateUrl: './set-row.component.html',
  styleUrl: './set-row.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, UiNumberInputComponent],
})
export class SetRowComponent {
  private static readonly SECONDS_PER_MINUTE: number = 60;

  private static readonly DISTANCE_UNIT_LABELS: Record<DistanceUnit, string> = {
    [DistanceUnit.Meters]: 'm',
    [DistanceUnit.Yards]: 'yd',
    [DistanceUnit.Km]: 'km',
    [DistanceUnit.Miles]: 'mi',
  };

  readonly set: InputSignal<ItemSet> = input.required<ItemSet>();
  readonly setNumber: InputSignal<number> = input.required<number>();
  readonly trackingType: InputSignal<TrackingType> = input.required<TrackingType>();
  readonly distanceUnit: InputSignal<DistanceUnit> = input<DistanceUnit>(DistanceUnit.Km);
  readonly isReadOnly: InputSignal<boolean> = input<boolean>(false);
  readonly translation: InputSignal<Record<string, string>> = input.required<Record<string, string>>();

  readonly changed: OutputEmitterRef<SetChangedPayload> = output<SetChangedPayload>();
  readonly removed: OutputEmitterRef<void> = output<void>();

  protected readonly trackingTypeEnum: typeof TrackingType = TrackingType;
  protected readonly ButtonType: typeof ButtonType = ButtonType;

  readonly distanceUnitLabel: Signal<string> = computed(
    () => SetRowComponent.DISTANCE_UNIT_LABELS[this.distanceUnit()],
  );

  private readonly _weightKg: WritableSignal<number | null> = linkedSignal(
    () => this.set().weightKg,
  );

  private readonly _reps: WritableSignal<number | null> = linkedSignal(
    () => this.set().reps,
  );

  private readonly _durationMinutes: WritableSignal<number | null> = linkedSignal(() => {
    const sec = this.set().durationSec;
    return sec !== null ? Math.floor(sec / SetRowComponent.SECONDS_PER_MINUTE) : null;
  });

  private readonly _durationSeconds: WritableSignal<number | null> = linkedSignal(() => {
    const sec = this.set().durationSec;
    return sec !== null ? sec % SetRowComponent.SECONDS_PER_MINUTE : null;
  });

  private readonly _displayDistance: WritableSignal<number | null> = linkedSignal(() => {
    const meters = this.set().distanceM;
    if (meters === null) {
      return null;
    }
    switch (this.distanceUnit()) {
      case DistanceUnit.Km:
        return metersToKm(meters);
      case DistanceUnit.Miles:
        return metersToMiles(meters);
      case DistanceUnit.Yards:
        return metersToYards(meters);
      default:
        return meters;
    }
  });

  protected readonly weightKg: Signal<number | null> = this._weightKg;
  protected readonly reps: Signal<number | null> = this._reps;
  protected readonly durationMinutes: Signal<number | null> = this._durationMinutes;
  protected readonly durationSeconds: Signal<number | null> = this._durationSeconds;
  protected readonly displayDistance: Signal<number | null> = this._displayDistance;

  protected onWeightChange(value: number | null): void {
    this._weightKg.set(value);
    this.changed.emit({
      weightKg: this._weightKg(),
      reps: this._reps(),
      durationSec: null,
      distanceM: null,
    });
  }

  protected onRepsChange(value: number | null): void {
    this._reps.set(value === null ? null : Math.round(value));
    this.changed.emit({
      weightKg: this._weightKg(),
      reps: this._reps(),
      durationSec: null,
      distanceM: null,
    });
  }

  protected onMinutesChange(value: number | null): void {
    this._durationMinutes.set(value === null ? null : Math.round(value));
    this.emitDuration();
  }

  protected onSecondsChange(value: number | null): void {
    this._durationSeconds.set(value === null ? null : Math.round(value));
    this.emitDuration();
  }

  protected onDistanceChange(value: number | null): void {
    if (value === null) {
      this._displayDistance.set(null);
      this.changed.emit({ weightKg: null, reps: null, durationSec: null, distanceM: null });
      return;
    }
    this._displayDistance.set(value);
    this.changed.emit({
      weightKg: null,
      reps: null,
      durationSec: null,
      distanceM: this.displayToMeters(value),
    });
  }

  protected onRemoved(): void {
    this.removed.emit();
  }

  private emitDuration(): void {
    const minutes = this._durationMinutes();
    const seconds = this._durationSeconds();
    if (minutes === null && seconds === null) {
      this.changed.emit({ weightKg: null, reps: null, durationSec: null, distanceM: null });
      return;
    }
    const totalSeconds =
      (minutes ?? 0) * SetRowComponent.SECONDS_PER_MINUTE + (seconds ?? 0);
    this.changed.emit({ weightKg: null, reps: null, durationSec: totalSeconds, distanceM: null });
  }

  private displayToMeters(value: number): number {
    switch (this.distanceUnit()) {
      case DistanceUnit.Km:
        return kmToMeters(value);
      case DistanceUnit.Miles:
        return milesToMeters(value);
      case DistanceUnit.Yards:
        return yardsToMeters(value);
      default:
        return value;
    }
  }
}
