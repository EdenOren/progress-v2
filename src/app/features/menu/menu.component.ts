import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-menu',
  template: '<p>Menu</p>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuComponent {}
