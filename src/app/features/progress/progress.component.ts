import { ButtonType, SkeletonVariant, UiIconComponent, UiPageComponent, UiSkeletonComponent } from '@edenoren/ui-kit';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ProgressFacade } from './progress.facade';
import { SubjectCardComponent } from './components/subject-card/subject-card.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { AppIcon } from '../../shared/enums/app-icon.enum';

@Component({
  selector: 'app-progress',
  templateUrl: './progress.component.html',
  styleUrl: './progress.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ProgressFacade],
  imports: [
    SubjectCardComponent,
    UiPageComponent,
    EmptyStateComponent,
    UiSkeletonComponent,
    UiIconComponent,
  ],
})
export class ProgressComponent {
  protected readonly appIcon: typeof AppIcon = AppIcon;
  protected readonly facade: ProgressFacade = inject(ProgressFacade);
  protected readonly skeletonVariant: typeof SkeletonVariant = SkeletonVariant;
  protected readonly ButtonType: typeof ButtonType = ButtonType;

  protected addSubject(): void {
    void this.facade.openCreateSubjectDialog();
  }

  protected navigateToSubject(subjectId: string): void {
    this.facade.navigateToSubject(subjectId);
  }
}
