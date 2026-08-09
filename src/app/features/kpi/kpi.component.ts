import { UiPageComponent } from '@edenoren/ui-kit';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { KpiFacade } from './kpi.facade';
import { RecentWorkoutCardComponent } from './components/recent-workout-card/recent-workout-card.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { MaterialIcon } from '../../shared/enums/material-icon.enum';
import type { RecentEntry } from '../../core/services/data/entries.service';

@Component({
  selector: 'app-kpi',
  templateUrl: './kpi.component.html',
  styleUrl: './kpi.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [KpiFacade],
  imports: [UiPageComponent, RecentWorkoutCardComponent, EmptyStateComponent],
})
export class KpiComponent {
  protected readonly facade: KpiFacade = inject(KpiFacade);
  protected readonly MaterialIcon: typeof MaterialIcon = MaterialIcon;

  protected onWorkoutSelected(entry: RecentEntry): void {
    this.facade.navigateToEntry(entry);
  }
}
