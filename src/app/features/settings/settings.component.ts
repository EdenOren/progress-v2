import { ButtonType } from '@edenoren/ui-kit';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { SettingsFacade } from './settings.facade';
import { WeightUnit } from '../../shared/enums/weight-unit.enum';
import { DistanceUnit } from '../../shared/enums/distance-unit.enum';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [SettingsFacade],
})
export class SettingsComponent {
  protected readonly facade: SettingsFacade = inject(SettingsFacade);

  protected readonly weightUnit: typeof WeightUnit = WeightUnit;
  protected readonly distanceUnit: typeof DistanceUnit = DistanceUnit;
  protected readonly buttonType: typeof ButtonType = ButtonType;

  protected onWeightUnitChanged(unit: WeightUnit): void {
    this.facade.setWeightUnit(unit);
  }

  protected onDistanceUnitChanged(unit: DistanceUnit): void {
    this.facade.setDistanceUnit(unit);
  }
}
