import {
  ChangeDetectionStrategy,
  Component,
  input,
  InputSignal,
  output,
  OutputEmitterRef,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { UiButtonComponent } from '../../../../shared/components/ui-button/ui-button.component';
import { ButtonVariant } from '../../../../shared/enums/button-variant.enum';
import type { DailyLog } from '../../../../core/services/data/daily-log/daily-log.model';

@Component({
  selector: 'app-log-card',
  templateUrl: './log-card.component.html',
  styleUrl: './log-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, UiButtonComponent],
})
export class LogCardComponent {
  readonly entry: InputSignal<DailyLog> = input.required<DailyLog>();
  readonly translation: InputSignal<Record<string, string>> = input.required<Record<string, string>>();
  readonly editClicked: OutputEmitterRef<DailyLog> = output<DailyLog>();

  protected readonly buttonVariant: typeof ButtonVariant = ButtonVariant;

  protected onEdit(): void {
    this.editClicked.emit(this.entry());
  }
}
