import { ButtonType, SkeletonVariant, UiPageComponent, UiSkeletonComponent } from '@edenoren/ui-kit';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DailyLogFacade } from './daily-log.facade';
import { LogCardComponent } from './components/log-card/log-card.component';
import type { DailyLog } from '../../core/services/data/daily-log/daily-log.model';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { AppIcon } from '../../shared/enums/app-icon.enum';
import { toLocalDateString } from '../../shared/utils/date';

@Component({
  selector: 'app-daily-log',
  templateUrl: './daily-log.component.html',
  styleUrl: './daily-log.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DailyLogFacade],
  imports: [LogCardComponent, UiPageComponent, EmptyStateComponent, UiSkeletonComponent],
})
export class DailyLogComponent {
  protected readonly appIcon: typeof AppIcon = AppIcon;
  protected readonly facade: DailyLogFacade = inject(DailyLogFacade);
  protected readonly skeletonVariant: typeof SkeletonVariant = SkeletonVariant;
  protected readonly ButtonType: typeof ButtonType = ButtonType;

  protected onEditEntry(entry: DailyLog): void {
    void this.facade.openLogDialog(entry.loggedDate, entry);
  }

  protected onLogToday(): void {
    void this.facade.openLogDialog(toLocalDateString(new Date()));
  }
}
