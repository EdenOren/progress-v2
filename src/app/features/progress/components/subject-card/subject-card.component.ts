import { ButtonType, UiIconComponent } from '@edenoren/ui-kit';
import { ChangeDetectionStrategy, Component, input, InputSignal, output, OutputEmitterRef } from '@angular/core';
import { AppIcon } from '../../../../shared/enums/app-icon.enum';
import type { Subject } from '../../../../core/services/data/subjects.service';

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
  protected readonly ButtonType: typeof ButtonType = ButtonType;

  protected select(): void {
    this.selected.emit();
  }
}
