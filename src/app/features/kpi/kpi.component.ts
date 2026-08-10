import {
  ButtonType,
  SkeletonVariant,
  UiPageComponent,
  UiSkeletonComponent,
  UiStatTileComponent,
} from '@edenoren/ui-kit';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { KpiFacade } from './kpi.facade';
import { VolumeChartComponent } from './components/volume-chart/volume-chart.component';
import { SubjectFrequencyListComponent } from './components/subject-frequency-list/subject-frequency-list.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { KpiRange } from './enums/kpi-range.enum';
import { AppIcon } from '../../shared/enums/app-icon.enum';

@Component({
  selector: 'app-kpi',
  templateUrl: './kpi.component.html',
  styleUrl: './kpi.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [KpiFacade],
  imports: [
    UiPageComponent,
    UiSkeletonComponent,
    UiStatTileComponent,
    VolumeChartComponent,
    SubjectFrequencyListComponent,
    EmptyStateComponent,
  ],
})
export class KpiComponent {
  protected readonly appIcon: typeof AppIcon = AppIcon;
  protected readonly buttonType: typeof ButtonType = ButtonType;
  protected readonly facade: KpiFacade = inject(KpiFacade);
  protected readonly kpiRange: typeof KpiRange = KpiRange;
  protected readonly skeletonVariant: typeof SkeletonVariant = SkeletonVariant;

  protected onRangeSelected(range: KpiRange): void {
    this.facade.selectRange(range);
  }
}
