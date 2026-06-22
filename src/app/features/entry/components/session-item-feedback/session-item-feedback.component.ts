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
import { FeedbackRating } from '../../../../shared/enums/feedback-rating.enum';
import { ButtonType } from '../../../../shared/enums/button-type.enum';
import type { ItemFeedback } from '../../../../core/services/data/items.service';

@Component({
  selector: 'app-session-item-feedback',
  templateUrl: './session-item-feedback.component.html',
  styleUrl: './session-item-feedback.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SessionItemFeedbackComponent {
  readonly feedback: InputSignal<ItemFeedback | null> = input<ItemFeedback | null>(null);
  readonly translation: InputSignal<Record<string, string>> = input.required<Record<string, string>>();

  readonly feedbackChanged: OutputEmitterRef<FeedbackRating> = output<FeedbackRating>();

  protected readonly feedbackRating: typeof FeedbackRating = FeedbackRating;
  protected readonly ButtonType: typeof ButtonType = ButtonType;

  readonly isSuccessFeedback: Signal<boolean> = computed(
    () => this.feedback()?.rating === FeedbackRating.Success,
  );
  readonly isHardFeedback: Signal<boolean> = computed(
    () => this.feedback()?.rating === FeedbackRating.Hard,
  );
  readonly isFailFeedback: Signal<boolean> = computed(
    () => this.feedback()?.rating === FeedbackRating.Fail,
  );

  protected onFeedbackChanged(rating: FeedbackRating): void {
    this.feedbackChanged.emit(rating);
  }
}
