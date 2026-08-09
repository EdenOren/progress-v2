import { ButtonType } from '@edenoren/ui-kit';
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
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { SetRowComponent } from '../set-row/set-row.component';
import { SessionItemFeedbackComponent } from '../session-item-feedback/session-item-feedback.component';
import { SessionItemNoteComponent } from '../session-item-note/session-item-note.component';
import { FeedbackRating } from '../../../../shared/enums/feedback-rating.enum';
import { TrackingType } from '../../../../shared/enums/tracking-type.enum';
import { DistanceUnit } from '../../../../shared/enums/distance-unit.enum';
import { metersToKm, metersToMiles, metersToYards } from '../../../../shared/utils/unit-conversion';
import type { SessionItem, ItemSet } from '../../../../core/services/data/items.service';
import type { SetChangedPayload } from '../../../../core/services/data/item-sets.service';

export interface SetChangedEvent {
  itemId: string;
  setIndex: number;
  payload: SetChangedPayload;
}

export interface SetRemovedEvent {
  itemId: string;
  setIndex: number;
}

export interface FeedbackChangedEvent {
  itemId: string;
  rating: FeedbackRating;
}

export interface NoteChangedEvent {
  itemId: string;
  note: string;
}

@Component({
  selector: 'app-session-item',
  templateUrl: './session-item.component.html',
  styleUrl: './session-item.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, MatButtonModule, SetRowComponent, SessionItemFeedbackComponent, SessionItemNoteComponent],
})
export class SessionItemComponent {
  private static readonly SECONDS_PER_MINUTE: number = 60;

  readonly item: InputSignal<SessionItem> = input.required<SessionItem>();
  readonly previousSets: InputSignal<ItemSet[]> = input<ItemSet[]>([]);
  readonly distanceUnit: InputSignal<DistanceUnit> = input<DistanceUnit>(DistanceUnit.Km);
  readonly isReadOnly: InputSignal<boolean> = input<boolean>(false);
  readonly isActive: InputSignal<boolean> = input<boolean>(true);
  readonly translation: InputSignal<Record<string, string>> = input.required<Record<string, string>>();

  readonly setChanged: OutputEmitterRef<SetChangedEvent> = output<SetChangedEvent>();
  readonly setAdded: OutputEmitterRef<string> = output<string>();
  readonly setRemoved: OutputEmitterRef<SetRemovedEvent> = output<SetRemovedEvent>();
  readonly feedbackChanged: OutputEmitterRef<FeedbackChangedEvent> = output<FeedbackChangedEvent>();
  readonly noteChanged: OutputEmitterRef<NoteChangedEvent> = output<NoteChangedEvent>();
  readonly deleteRequested: OutputEmitterRef<string> = output<string>();
  readonly activated: OutputEmitterRef<string> = output<string>();

  protected readonly ButtonType: typeof ButtonType = ButtonType;

  /**
   * A rating is what marks an exercise finished, and it has to stay readable
   * once given — collapsed or expanded. Exposed as booleans so the template
   * never compares strings.
   */
  readonly isFinished: Signal<boolean> = computed(() => !!this.item().feedback);

  protected readonly isSuccessRated: Signal<boolean> = computed(
    () => this.item().feedback?.rating === FeedbackRating.Success,
  );

  protected readonly isHardRated: Signal<boolean> = computed(
    () => this.item().feedback?.rating === FeedbackRating.Hard,
  );

  protected readonly isFailRated: Signal<boolean> = computed(
    () => this.item().feedback?.rating === FeedbackRating.Fail,
  );

  protected readonly setSummary: Signal<string> = computed(() => {
    const setCount: number = this.item().sets.length;
    const label: string = setCount === 1 ? this.translation()['SET_ONE'] : this.translation()['SET_MANY'];
    return `${setCount} ${label ?? ''}`.trim();
  });

  readonly formattedPreviousSets: Signal<string> = computed(() => {
    const sets = this.previousSets();
    if (!sets.length) {
      return '';
    }
    const trackingType = this.item().trackingType;
    const unit = this.distanceUnit();
    return sets.map((set) => this.formatSet(set, trackingType, unit)).join(', ');
  });

  protected onSetChanged(setIndex: number, payload: SetChangedPayload): void {
    this.setChanged.emit({ itemId: this.item().id, setIndex, payload });
  }

  protected onSetAdded(): void {
    this.setAdded.emit(this.item().id);
  }

  protected onSetRemoved(setIndex: number): void {
    this.setRemoved.emit({ itemId: this.item().id, setIndex });
  }

  protected onFeedbackChanged(rating: FeedbackRating): void {
    this.feedbackChanged.emit({ itemId: this.item().id, rating });
  }

  protected onNoteChanged(note: string): void {
    this.noteChanged.emit({ itemId: this.item().id, note });
  }

  protected onDeleteRequested(): void {
    this.deleteRequested.emit(this.item().id);
  }

  protected onActivated(): void {
    this.activated.emit(this.item().id);
  }

  private formatSet(set: ItemSet, trackingType: TrackingType, unit: DistanceUnit): string {
    if (trackingType === TrackingType.WeightReps) {
      const weight = set.weightKg !== null ? `${set.weightKg}kg` : '—';
      const repsValue = set.reps !== null ? String(set.reps) : '—';
      return `${weight} × ${repsValue}`;
    }
    if (trackingType === TrackingType.Duration) {
      const sec = set.durationSec;
      if (sec === null) {
        return '—';
      }
      const minutes = Math.floor(sec / SessionItemComponent.SECONDS_PER_MINUTE);
      const seconds = sec % SessionItemComponent.SECONDS_PER_MINUTE;
      return `${minutes}:${String(seconds).padStart(2, '0')}`;
    }
    const meters = set.distanceM;
    if (meters === null) {
      return '—';
    }
    switch (unit) {
      case DistanceUnit.Km:
        return `${metersToKm(meters).toFixed(2)}km`;
      case DistanceUnit.Miles:
        return `${metersToMiles(meters).toFixed(2)}mi`;
      case DistanceUnit.Yards:
        return `${Math.round(metersToYards(meters))}yd`;
      default:
        return `${meters}m`;
    }
  }
}
