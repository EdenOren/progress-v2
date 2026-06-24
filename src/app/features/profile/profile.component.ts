import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ProfileFacade } from './profile.facade';

@Component({
  selector: 'app-profile',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ProfileFacade],
})
export class ProfileComponent {}
