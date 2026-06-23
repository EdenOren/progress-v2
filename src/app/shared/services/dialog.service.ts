import { inject, OutputEmitterRef, Service, Type } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { DialogType } from '../enums/dialog-type.enum';
import {
  CreateSubjectDialogComponent,
  CreateSubjectFormData,
} from '../components/create-subject-dialog/create-subject-dialog.component';
import { AddItemDialogComponent } from '../components/add-item-dialog/add-item-dialog.component';
import {
  CompleteSessionDialogComponent,
  CompleteSessionDialogData,
  CompleteSessionResult,
} from '../components/complete-session-dialog/complete-session-dialog.component';
import {
  ConfirmationDialogComponent,
  ConfirmationDialogData,
} from '../components/confirmation-dialog/confirmation-dialog.component';
import {
  LogEntryDialogComponent,
  LogEntryDialogData,
  LogEntryFormData,
} from '../components/log-entry-dialog/log-entry-dialog.component';

interface DialogCloseable<T> {
  submitted: OutputEmitterRef<T>;
  closed: OutputEmitterRef<void>;
}

@Service()
export class DialogService {
  private readonly matDialog: MatDialog = inject(MatDialog);

  open(type: DialogType.CreateSubject): Promise<CreateSubjectFormData | undefined>;
  open(type: DialogType.AddItem): Promise<string | undefined>;
  open(type: DialogType.CompleteSession, data: CompleteSessionDialogData): Promise<CompleteSessionResult | undefined>;
  open(type: DialogType.Confirmation, data: ConfirmationDialogData): Promise<boolean>;
  open(type: DialogType.LogEntry, data: LogEntryDialogData): Promise<LogEntryFormData | undefined>;
  open(type: DialogType, data?: unknown): Promise<unknown> {
    switch (type) {
      case DialogType.CreateSubject:
        return this.openDialog<CreateSubjectFormData>(
          CreateSubjectDialogComponent,
          { width: CreateSubjectDialogComponent.DIALOG_WIDTH },
        );
      case DialogType.AddItem:
        return this.openDialog<string>(
          AddItemDialogComponent,
          { width: AddItemDialogComponent.DIALOG_WIDTH },
        );
      case DialogType.CompleteSession:
        return this.openDialog<CompleteSessionResult>(
          CompleteSessionDialogComponent,
          { width: CompleteSessionDialogComponent.DIALOG_WIDTH, data },
        );
      case DialogType.LogEntry:
        return this.openDialog<LogEntryFormData>(
          LogEntryDialogComponent,
          { width: LogEntryDialogComponent.DIALOG_WIDTH, data },
        );
      case DialogType.Confirmation: {
        const ref = this.matDialog.open<ConfirmationDialogComponent, ConfirmationDialogData, boolean>(
          ConfirmationDialogComponent,
          { width: ConfirmationDialogComponent.DIALOG_WIDTH, data: data as ConfirmationDialogData },
        );
        ref.componentInstance.submitted.subscribe(() => ref.close(true));
        ref.componentInstance.closed.subscribe(() => ref.close(false));
        return firstValueFrom(ref.afterClosed()).then(result => result ?? false);
      }
    }
  }

  private async openDialog<T>(
    component: Type<DialogCloseable<T>>,
    config: MatDialogConfig = {},
  ): Promise<T | undefined> {
    const ref = this.matDialog.open(component, config);
    const instance = ref.componentInstance;
    instance.submitted.subscribe((value: T) => ref.close(value));
    instance.closed.subscribe(() => ref.close(undefined));
    return firstValueFrom(ref.afterClosed());
  }
}
