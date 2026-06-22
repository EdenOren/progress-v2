import { ChangeDetectionStrategy, Component, computed, input, InputSignal, output, OutputEmitterRef, Signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { UiIconComponent } from '../../../../shared/components/ui-icon/ui-icon.component';
import { AppIcon } from '../../../../shared/enums/app-icon.enum';
import { ButtonType } from '../../../../shared/enums/button-type.enum';
import type { Entry } from '../../../../core/services/data/entries.service';

@Component({
  selector: 'app-entry-card',
  templateUrl: './entry-card.component.html',
  styleUrl: './entry-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, UiIconComponent],
})
export class EntryCardComponent {
  protected static readonly SECONDS_PER_MINUTE: number = 60;
  protected static readonly MINUTES_PER_HOUR: number = 60;

  readonly entry: InputSignal<Entry> = input.required<Entry>();
  readonly selected: OutputEmitterRef<void> = output<void>();

  protected readonly appIcon: typeof AppIcon = AppIcon;
  protected readonly ButtonType: typeof ButtonType = ButtonType;

  protected readonly formattedDuration: Signal<string> = computed(() => {
    const seconds = this.entry().durationSeconds;
    if (!seconds) {
      return '';
    }
    const minutes = Math.floor(seconds / EntryCardComponent.SECONDS_PER_MINUTE);
    if (minutes < EntryCardComponent.MINUTES_PER_HOUR) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / EntryCardComponent.MINUTES_PER_HOUR);
    const remainingMinutes = minutes % EntryCardComponent.MINUTES_PER_HOUR;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  });

  protected select(): void {
    this.selected.emit();
  }
}
