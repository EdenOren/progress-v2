import { ChangeDetectionStrategy, Component, computed, input, InputSignal, Signal } from '@angular/core';
import { UserAvatarSize } from '../../enums/user-avatar-size.enum';

@Component({
  selector: 'app-user-avatar',
  templateUrl: './user-avatar.component.html',
  styleUrl: './user-avatar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'user-avatar',
    '[class.user-avatar--lg]': 'isLarge()',
    'aria-hidden': 'true',
  },
})
export class UserAvatarComponent {
  readonly initial: InputSignal<string> = input.required<string>();
  readonly size: InputSignal<UserAvatarSize> = input<UserAvatarSize>(UserAvatarSize.Sm);

  protected readonly isLarge: Signal<boolean> = computed(() => this.size() === UserAvatarSize.Lg);
}
