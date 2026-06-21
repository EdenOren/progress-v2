import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { EntryFacade } from './entry.facade';

@Component({
  selector: 'app-entry',
  templateUrl: './entry.component.html',
  styleUrl: './entry.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [EntryFacade],
  imports: [MatIconModule],
})
export class EntryComponent {
  protected readonly facade: EntryFacade = inject(EntryFacade);

  protected navigateBack(): void {
    this.facade.navigateBack();
  }
}
