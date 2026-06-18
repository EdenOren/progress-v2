import { ChangeDetectionStrategy, Component, input, InputSignal } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-ui-link',
  templateUrl: './ui-link.component.html',
  styleUrl: './ui-link.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
})
export class UiLinkComponent {
  readonly label: InputSignal<string> = input.required<string>();
  readonly route: InputSignal<string[]> = input.required<string[]>();
}
