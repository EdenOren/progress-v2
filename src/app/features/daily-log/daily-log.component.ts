import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DailyLogFacade } from './daily-log.facade';

@Component({
  selector: 'app-daily-log',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DailyLogFacade],
})
export class DailyLogComponent {}
