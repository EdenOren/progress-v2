import { inject, Service } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import {
  ConfirmationDialogComponent,
  ConfirmationDialogData,
} from '../components/confirmation-dialog/confirmation-dialog.component';

@Service()
export class ConfirmationDialogService {
  private readonly dialog: MatDialog = inject(MatDialog);

  async open(data: ConfirmationDialogData): Promise<boolean> {
    const dialogRef = this.dialog.open<ConfirmationDialogComponent, ConfirmationDialogData, boolean>(
      ConfirmationDialogComponent,
      {
        width: ConfirmationDialogComponent.DIALOG_WIDTH,
        data,
      },
    );
    const result: boolean | undefined = await firstValueFrom(dialogRef.afterClosed());
    return result === true;
  }
}
