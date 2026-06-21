import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-ui-modal',
  templateUrl: './ui-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDialogModule],
})
export class UiModalComponent {}
