import { ButtonType, UiPageComponent } from '@edenoren/ui-kit';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DailyLogFacade } from './daily-log.facade';
import { LogCardComponent } from './components/log-card/log-card.component';
import type { DailyLog } from '../../core/services/data/daily-log/daily-log.model';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { MaterialIcon } from '../../shared/enums/material-icon.enum';

@Component({
  selector: 'app-daily-log',
  templateUrl: './daily-log.component.html',
  styleUrl: './daily-log.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DailyLogFacade],
  imports: [LogCardComponent, UiPageComponent, EmptyStateComponent],
})
export class DailyLogComponent {
  protected readonly facade: DailyLogFacade = inject(DailyLogFacade);
  protected readonly ButtonType: typeof ButtonType = ButtonType;
  protected readonly MaterialIcon: typeof MaterialIcon = MaterialIcon;

  protected onEditEntry(entry: DailyLog): void {
    void this.facade.openLogDialog(entry.loggedDate, entry);
  }

  protected onLogToday(): void {
    const now: Date = new Date();
    const year: number = now.getFullYear();
    const month: string = String(now.getMonth() + 1).padStart(2, '0');
    const day: string = String(now.getDate()).padStart(2, '0');
    void this.facade.openLogDialog(`${year}-${month}-${day}`);
  }
}
