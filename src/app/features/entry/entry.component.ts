import { ButtonType, SkeletonVariant, UiPageComponent, UiSkeletonComponent } from '@edenoren/ui-kit';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { EntryFacade } from './entry.facade';
import { SessionItemComponent } from './components/session-item/session-item.component';
import type { ItemSet } from '../../core/services/data/items.service';
import type {
  SetChangedEvent,
  SetRemovedEvent,
  FeedbackChangedEvent,
  NoteChangedEvent,
} from './components/session-item/session-item.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { MaterialIcon } from '../../shared/enums/material-icon.enum';

@Component({
  selector: 'app-entry',
  templateUrl: './entry.component.html',
  styleUrl: './entry.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [EntryFacade],
  imports: [
    MatIconModule,
    MatButtonModule,
    SessionItemComponent,
    UiPageComponent,
    EmptyStateComponent,
    UiSkeletonComponent,
  ],
})
export class EntryComponent {
  protected readonly facade: EntryFacade = inject(EntryFacade);
  protected readonly skeletonVariant: typeof SkeletonVariant = SkeletonVariant;
  protected readonly ButtonType: typeof ButtonType = ButtonType;
  protected readonly MaterialIcon: typeof MaterialIcon = MaterialIcon;

  protected previousSetsFor(itemName: string): ItemSet[] {
    return this.facade.previousSetsMap().get(itemName) ?? [];
  }

  protected onSetChanged(event: SetChangedEvent): void {
    void this.facade.saveSet(event.itemId, event.setIndex, event.payload);
  }

  protected onSetAdded(itemId: string): void {
    void this.facade.addSet(itemId);
  }

  protected onSetRemoved(event: SetRemovedEvent): void {
    void this.facade.deleteSet(event.itemId, event.setIndex);
  }

  protected onFeedbackChanged(event: FeedbackChangedEvent): void {
    void this.facade.saveFeedback(event.itemId, event.rating);
  }

  protected onNoteChanged(event: NoteChangedEvent): void {
    void this.facade.saveNote(event.itemId, event.note);
  }

  protected onItemDeleted(itemId: string): void {
    void this.facade.deleteItem(itemId);
  }

  protected onItemActivated(itemId: string): void {
    this.facade.setActiveItem(itemId);
  }

  protected openAddItemDialog(): void {
    void this.facade.openAddItemDialog();
  }

  protected openCompleteDialog(): void {
    void this.facade.openCompleteDialog();
  }

  protected navigateBack(): void {
    this.facade.navigateBack();
  }
}
