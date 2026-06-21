import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-kpi',
  template: '<p>KPI</p>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KpiComponent {}
