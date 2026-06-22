import { ChangeDetectionStrategy, Component, input, InputSignal, output, OutputEmitterRef } from '@angular/core';
import { UiIconComponent } from '../../../../shared/components/ui-icon/ui-icon.component';
import { AppIcon } from '../../../../shared/enums/app-icon.enum';
import type { Subject } from '../../../../core/services/data/subjects.data';

@Component({
  selector: 'app-subject-card',
  templateUrl: './subject-card.component.html',
  styleUrl: './subject-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiIconComponent],
})
export class SubjectCardComponent {
  readonly subject: InputSignal<Subject> = input.required<Subject>();
  readonly selected: OutputEmitterRef<void> = output<void>();

  protected readonly appIcon: typeof AppIcon = AppIcon;

  protected select(): void {
    this.selected.emit();
  }
}
