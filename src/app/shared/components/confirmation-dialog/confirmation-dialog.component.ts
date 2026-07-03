import { ChangeDetectionStrategy, Component, inject, output, OutputEmitterRef } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
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
  protected readonly data: ConfirmationDialogData = inject<ConfirmationDialogData>(MAT_DIALOG_DATA);
  protected readonly buttonVariant: typeof ButtonVariant = ButtonVariant;

  readonly submitted: OutputEmitterRef<void> = output<void>();
  readonly closed: OutputEmitterRef<void> = output<void>();

  protected onSubmit(): void {
    this.submitted.emit();
  }

  protected onClose(): void {
    this.closed.emit();
  }
}
