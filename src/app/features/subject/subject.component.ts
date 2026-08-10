import { ButtonType, SkeletonVariant, UiPageComponent, UiSkeletonComponent } from '@edenoren/ui-kit';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { SubjectFacade } from './subject.facade';
import { EntryCardComponent } from './components/entry-card/entry-card.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { MaterialIcon } from '../../shared/enums/material-icon.enum';

@Component({
  selector: 'app-subject',
  templateUrl: './subject.component.html',
  styleUrl: './subject.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [SubjectFacade],
  imports: [
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    EntryCardComponent,
    UiPageComponent,
    EmptyStateComponent,
    UiSkeletonComponent,
  ],
})
export class SubjectComponent {
  protected readonly facade: SubjectFacade = inject(SubjectFacade);
  protected readonly skeletonVariant: typeof SkeletonVariant = SkeletonVariant;
  protected readonly ButtonType: typeof ButtonType = ButtonType;
  protected readonly MaterialIcon: typeof MaterialIcon = MaterialIcon;

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
