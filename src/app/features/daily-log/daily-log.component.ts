import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { DailyLogFacade } from './daily-log.facade';
import { LogCardComponent } from './components/log-card/log-card.component';
import { ButtonType } from '../../shared/enums/button-type.enum';
import type { DailyLog } from '../../core/services/data/daily-log.service';

@Component({
  selector: 'app-daily-log',
  templateUrl: './daily-log.component.html',
  styleUrl: './daily-log.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DailyLogFacade],
  imports: [MatIconModule, LogCardComponent],
})
export class DailyLogComponent {
  protected readonly facade: DailyLogFacade = inject(DailyLogFacade);
  protected readonly ButtonType: typeof ButtonType = ButtonType;

  protected onEditEntry(entry: DailyLog): void {
    void this.facade.openLogDialog(entry.loggedDate, entry);
  }

  protected onLogToday(): void {
    void this.facade.openLogDialog(new Date().toISOString().split('T')[0]);
  }
}
