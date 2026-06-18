import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-progress',
  template: '<p>Progress</p>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgressComponent {}
