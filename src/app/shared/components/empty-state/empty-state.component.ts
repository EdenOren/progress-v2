import { ChangeDetectionStrategy, Component, input, InputSignal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MaterialIcon } from '../../enums/material-icon.enum';

@Component({
  selector: 'app-empty-state',
  templateUrl: './empty-state.component.html',
  styleUrl: './empty-state.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
})
export class EmptyStateComponent {
  readonly icon: InputSignal<MaterialIcon> = input.required<MaterialIcon>();
  readonly text: InputSignal<string> = input.required<string>();
}
