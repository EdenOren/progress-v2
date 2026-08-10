import { SkeletonVariant, UiPageComponent, UiSkeletonComponent } from '@edenoren/ui-kit';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { KpiFacade } from './kpi.facade';
import { RecentWorkoutCardComponent } from './components/recent-workout-card/recent-workout-card.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import type { RecentEntry } from '../../core/services/data/entries.service';
import { AppIcon } from '../../shared/enums/app-icon.enum';

@Component({
  selector: 'app-kpi',
  templateUrl: './kpi.component.html',
  styleUrl: './kpi.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [KpiFacade],
  imports: [UiPageComponent, RecentWorkoutCardComponent, EmptyStateComponent, UiSkeletonComponent],
})
export class KpiComponent {
  protected readonly appIcon: typeof AppIcon = AppIcon;
  protected readonly facade: KpiFacade = inject(KpiFacade);
  protected readonly skeletonVariant: typeof SkeletonVariant = SkeletonVariant;

  protected onWorkoutSelected(entry: RecentEntry): void {
    this.facade.navigateToEntry(entry);
  }
}
