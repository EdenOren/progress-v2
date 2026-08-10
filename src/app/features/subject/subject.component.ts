import { ButtonType, SkeletonVariant, UiIconComponent, UiPageComponent, UiSkeletonComponent } from '@edenoren/ui-kit';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { SubjectFacade } from './subject.facade';
import { EntryCardComponent } from './components/entry-card/entry-card.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { AppIcon } from '../../shared/enums/app-icon.enum';

@Component({
  selector: 'app-subject',
  templateUrl: './subject.component.html',
  styleUrl: './subject.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [SubjectFacade],
  imports: [
    MatButtonModule,
    MatMenuModule,
    EntryCardComponent,
    UiPageComponent,
    EmptyStateComponent,
    UiSkeletonComponent,
    UiIconComponent,
  ],
})
export class SubjectComponent {
  protected readonly appIcon: typeof AppIcon = AppIcon;
  protected readonly facade: SubjectFacade = inject(SubjectFacade);
  protected readonly skeletonVariant: typeof SkeletonVariant = SkeletonVariant;
  protected readonly ButtonType: typeof ButtonType = ButtonType;

  protected navigateBack(): void {
    this.facade.navigateBack();
  }

  protected navigateToEntry(entryId: string): void {
    this.facade.navigateToEntry(entryId);
  }

  protected deleteSubject(): void {
    void this.facade.deleteSubjectWithConfirmation();
  }

  protected startWorkout(): void {
    void this.facade.startWorkout();
  }
}
