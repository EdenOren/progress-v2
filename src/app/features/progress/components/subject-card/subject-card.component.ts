import { ChangeDetectionStrategy, Component, input, InputSignal, output, OutputEmitterRef } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import type { Subject } from '../../../../core/services/data/subjects.data';

@Component({
  selector: 'app-subject-card',
  templateUrl: './subject-card.component.html',
  styleUrl: './subject-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
})
export class SubjectCardComponent {
  readonly subject: InputSignal<Subject> = input.required<Subject>();
  readonly selected: OutputEmitterRef<void> = output<void>();

  protected select(): void {
    this.selected.emit();
  }
}
