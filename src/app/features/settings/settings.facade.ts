import {
  computed,
  effect,
  inject,
  resource,
  ResourceRef,
  Service,
  Signal,
  signal,
  WritableSignal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../core/services/platform/auth.service';
import { UserSettingsService } from '../../core/services/data/user-settings.service';
import type {
  UpdateWorkoutSettingsInput,
  WorkoutSettings,
} from '../../core/services/data/user-settings.service';
import type { Result } from '../../core/types/result';
import { WeightUnit } from '../../shared/enums/weight-unit.enum';
import { DistanceUnit } from '../../shared/enums/distance-unit.enum';

@Service({ autoProvided: false })
export class SettingsFacade {
  private static readonly SAVE_SUCCESS_DURATION_MS: number = 2000;

  private readonly userSettingsService: UserSettingsService = inject(UserSettingsService);
  private readonly authService: AuthService = inject(AuthService);
  private readonly translateService: TranslateService = inject(TranslateService);

  readonly translation: Signal<Record<string, string>> = toSignal(
    this.translateService.stream('SETTINGS'),
    { initialValue: {} as Record<string, string> },
  );

  private readonly _settingsResource: ResourceRef<Result<WorkoutSettings> | undefined> = resource({
    params: () => ({ userId: this.authService.userId() }),
    loader: ({ params }) => this.userSettingsService.getWorkoutSettings(params.userId),
  });

  readonly isLoading: Signal<boolean> = computed(() => this._settingsResource.isLoading());

  readonly hasError: Signal<boolean> = computed(() => {
    const result = this._settingsResource.value();
    return !!result && !result.success;
  });

  private readonly _weightUnit: WritableSignal<WeightUnit> = signal(WeightUnit.Kg);
  private readonly _distanceUnit: WritableSignal<DistanceUnit> = signal(DistanceUnit.Km);

  readonly weightUnit: Signal<WeightUnit> = this._weightUnit;
  readonly distanceUnit: Signal<DistanceUnit> = this._distanceUnit;

  private readonly _saving: WritableSignal<boolean> = signal(false);
  private readonly _saveSuccess: WritableSignal<boolean> = signal(false);
  private readonly _saveError: WritableSignal<boolean> = signal(false);

  readonly saving: Signal<boolean> = this._saving;
  readonly saveSuccess: Signal<boolean> = this._saveSuccess;
  readonly saveError: Signal<boolean> = this._saveError;

  private loaded: boolean = false;

  constructor() {
    effect(() => {
      const result = this._settingsResource.value();
      if (result?.success && !this.loaded) {
        this.loaded = true;
        this._weightUnit.set(result.data.weightUnit);
        this._distanceUnit.set(result.data.distanceUnit);
      }
    });
  }

  setWeightUnit(unit: WeightUnit): void {
    const previous: WeightUnit = this._weightUnit();
    this._weightUnit.set(unit);
    void this.save({ weightUnit: unit }, () => this._weightUnit.set(previous));
  }

  setDistanceUnit(unit: DistanceUnit): void {
    const previous: DistanceUnit = this._distanceUnit();
    this._distanceUnit.set(unit);
    void this.save({ distanceUnit: unit }, () => this._distanceUnit.set(previous));
  }

  private async save(input: UpdateWorkoutSettingsInput, rollback: () => void): Promise<void> {
    this._saving.set(true);
    this._saveError.set(false);
    const result: Result<WorkoutSettings> = await this.userSettingsService.updateWorkoutSettings(
      this.authService.userId(),
      input,
    );
    this._saving.set(false);
    if (!result.success) {
      rollback();
      this._saveError.set(true);
      return;
    }
    this._saveSuccess.set(true);
    setTimeout(() => this._saveSuccess.set(false), SettingsFacade.SAVE_SUCCESS_DURATION_MS);
  }
}
