import {
  ChangeDetectionStrategy,
  Component,
  input,
  InputSignal,
  output,
  OutputEmitterRef,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { ButtonType } from '../../../../shared/enums/button-type.enum';
import type { DailyLog } from '../../../../core/services/data/daily-log/daily-log.model';

@Component({
  selector: 'app-log-card',
  templateUrl: './log-card.component.html',
  styleUrl: './log-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe],
})
export class LogCardComponent {
  readonly entry: InputSignal<DailyLog> = input.required<DailyLog>();
  readonly translation: InputSignal<Record<string, string>> = input.required<Record<string, string>>();
  readonly editClicked: OutputEmitterRef<DailyLog> = output<DailyLog>();

  protected readonly buttonType: typeof ButtonType = ButtonType;

  protected onEdit(): void {
    this.editClicked.emit(this.entry());
  }
}
