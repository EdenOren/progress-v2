import { ButtonType, UiIconComponent } from '@edenoren/ui-kit';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  InputSignal,
  output,
  OutputEmitterRef,
  Signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { AppIcon } from '../../../../shared/enums/app-icon.enum';
import { formatDuration } from '../../../../shared/utils/duration';
import type { RecentEntry } from '../../../../core/services/data/entries.service';

@Component({
  selector: 'app-recent-workout-card',
  templateUrl: './recent-workout-card.component.html',
  styleUrl: './recent-workout-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, UiIconComponent],
})
export class RecentWorkoutCardComponent {
  readonly entry: InputSignal<RecentEntry> = input.required<RecentEntry>();
  readonly selected: OutputEmitterRef<RecentEntry> = output<RecentEntry>();

  protected readonly appIcon: typeof AppIcon = AppIcon;
  protected readonly ButtonType: typeof ButtonType = ButtonType;

  protected readonly formattedDuration: Signal<string> = computed(() =>
    formatDuration(this.entry().durationSeconds),
  );

  protected select(): void {
    this.selected.emit(this.entry());
  }
}
