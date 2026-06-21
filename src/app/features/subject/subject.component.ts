import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { SubjectFacade } from './subject.facade';
import { EntryCardComponent } from './components/entry-card/entry-card.component';

@Component({
  selector: 'app-subject',
  templateUrl: './subject.component.html',
  styleUrl: './subject.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [SubjectFacade],
  imports: [MatIconModule, MatButtonModule, EntryCardComponent],
})
export class SubjectComponent {
  protected readonly facade: SubjectFacade = inject(SubjectFacade);

  protected navigateBack(): void {
    this.facade.navigateBack();
  }

  protected navigateToEntry(entryId: string): void {
    this.facade.navigateToEntry(entryId);
  }

  protected deleteSubject(): void {
    void this.facade.deleteSubjectWithConfirmation();
  }
}
