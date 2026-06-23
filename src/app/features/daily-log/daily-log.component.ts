import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DailyLogFacade } from './daily-log.facade';
import { LogCardComponent } from './components/log-card/log-card.component';
import { UiButtonComponent } from '../../shared/components/ui-button/ui-button.component';
import type { DailyLog } from '../../core/services/data/daily-log/daily-log.model';

@Component({
  selector: 'app-daily-log',
  templateUrl: './daily-log.component.html',
  styleUrl: './daily-log.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DailyLogFacade],
  imports: [LogCardComponent, UiButtonComponent],
})
export class DailyLogComponent {
  protected readonly facade: DailyLogFacade = inject(DailyLogFacade);

  protected onEditEntry(entry: DailyLog): void {
    void this.facade.openLogDialog(entry.loggedDate, entry);
  }

  protected onLogToday(): void {
    void this.facade.openLogDialog(new Date().toISOString().split('T')[0]);
  }
}
