import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UiModalComponent } from '../ui-modal/ui-modal.component';
import { UiButtonComponent } from '../ui-button/ui-button.component';
import { ButtonVariant } from '../../enums/button-variant.enum';

export interface ConfirmationDialogData {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
}

@Component({
  selector: 'app-confirmation-dialog',
  templateUrl: './confirmation-dialog.component.html',
  styleUrl: './confirmation-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiModalComponent, UiButtonComponent],
})
export class ConfirmationDialogComponent {
  static readonly DIALOG_WIDTH: string = '320px';

  protected readonly data: ConfirmationDialogData = inject<ConfirmationDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef: MatDialogRef<ConfirmationDialogComponent, boolean> = inject(
    MatDialogRef<ConfirmationDialogComponent, boolean>,
  );
  protected readonly buttonVariant: typeof ButtonVariant = ButtonVariant;

  protected confirm(): void {
    this.dialogRef.close(true);
  }

  protected cancel(): void {
    this.dialogRef.close(false);
  }
}
