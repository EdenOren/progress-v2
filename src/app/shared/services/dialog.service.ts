import { inject, Service } from '@angular/core';
import { ConfirmationDialogData, UiDialogService } from '@edenoren/ui-kit';
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
  LogEntryDialogComponent,
  LogEntryDialogData,
  LogEntryFormData,
} from '../components/log-entry-dialog/log-entry-dialog.component';

/**
 * Maps this app's dialogs to the shared open/close mechanism. DialogType stays here rather
 * than in ui-kit so adding a dialog is an app change, not a library release.
 */
@Service()
export class DialogService {
  private readonly uiDialogService: UiDialogService = inject(UiDialogService);

  open(type: DialogType.CreateSubject): Promise<CreateSubjectFormData | undefined>;
  open(type: DialogType.AddItem): Promise<string | undefined>;
  open(type: DialogType.CompleteSession, data: CompleteSessionDialogData): Promise<CompleteSessionResult | undefined>;
  open(type: DialogType.Confirmation, data: ConfirmationDialogData): Promise<boolean>;
  open(type: DialogType.LogEntry, data: LogEntryDialogData): Promise<LogEntryFormData | undefined>;
  open(type: DialogType, data?: unknown): Promise<unknown> {
    switch (type) {
      case DialogType.CreateSubject:
        return this.uiDialogService.openComponent<CreateSubjectFormData>(CreateSubjectDialogComponent);
      case DialogType.AddItem:
        return this.uiDialogService.openComponent<string>(AddItemDialogComponent);
      case DialogType.CompleteSession:
        return this.uiDialogService.openComponent<CompleteSessionResult>(CompleteSessionDialogComponent, { data });
      case DialogType.LogEntry:
        return this.uiDialogService.openComponent<LogEntryFormData>(LogEntryDialogComponent, { data });
      case DialogType.Confirmation:
        return this.uiDialogService.confirm(data as ConfirmationDialogData);
    }
  }
}
