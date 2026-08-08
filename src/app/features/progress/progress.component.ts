import { ButtonType, UiPageComponent } from '@edenoren/ui-kit';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ProgressFacade } from './progress.facade';
import { SubjectCardComponent } from './components/subject-card/subject-card.component';

@Component({
  selector: 'app-progress',
  templateUrl: './progress.component.html',
  styleUrl: './progress.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ProgressFacade],
  imports: [MatIconModule, SubjectCardComponent, UiPageComponent],
})
export class ProgressComponent {
  protected readonly facade: ProgressFacade = inject(ProgressFacade);
  protected readonly ButtonType: typeof ButtonType = ButtonType;

  protected addSubject(): void {
    void this.facade.openCreateSubjectDialog();
  }

  protected navigateToSubject(subjectId: string): void {
    this.facade.navigateToSubject(subjectId);
  }
}
