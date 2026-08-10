import { UiIconComponent } from '@edenoren/ui-kit';
import { ChangeDetectionStrategy, Component, input, InputSignal } from '@angular/core';
import { AppIcon } from '../../enums/app-icon.enum';

@Component({
  selector: 'app-empty-state',
  templateUrl: './empty-state.component.html',
  styleUrl: './empty-state.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiIconComponent],
})
export class EmptyStateComponent {
  readonly icon: InputSignal<AppIcon> = input.required<AppIcon>();
  readonly text: InputSignal<string> = input.required<string>();
}
