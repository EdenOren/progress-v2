import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  Signal,
  signal,
  WritableSignal,
} from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { TranslateService } from '@ngx-translate/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FieldTree, form, FormRoot, required } from '@angular/forms/signals';
import { UiInputComponent } from '../../../../shared/components/ui-input/ui-input.component';
import { UiModalComponent } from '../../../../shared/components/ui-modal/ui-modal.component';
import { InputType } from '../../../../shared/enums/input-type.enum';
import { ValidationKind } from '../../../../shared/enums/validation-kind.enum';

export interface CreateSubjectFormData {
  name: string;
  description: string;
}

interface CreateSubjectModel {
  name: string;
  description: string;
}

@Component({
  selector: 'app-create-subject-dialog',
  templateUrl: './create-subject-dialog.component.html',
  styleUrl: './create-subject-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiModalComponent, MatButtonModule, FormRoot, UiInputComponent],
})
export class CreateSubjectDialogComponent {
  static readonly DIALOG_WIDTH: string = '360px';

  private readonly dialogRef: MatDialogRef<CreateSubjectDialogComponent, CreateSubjectFormData> =
    inject(MatDialogRef<CreateSubjectDialogComponent, CreateSubjectFormData>);
  private readonly translateService: TranslateService = inject(TranslateService);

  protected readonly inputType: typeof InputType = InputType;

  readonly translation: Signal<Record<string, string>> = toSignal(
    this.translateService.stream('PROGRESS.CREATE_SUBJECT'),
    { initialValue: {} as Record<string, string> },
  );

  private readonly _model: WritableSignal<CreateSubjectModel> = signal({ name: '', description: '' });

  readonly createSubjectForm: FieldTree<CreateSubjectModel> = form(this._model, (fields) => {
    required(fields.name);
  });

  readonly nameTouched: Signal<boolean> = computed(() => this.createSubjectForm.name().touched());

  readonly nameError: Signal<string> = computed(() => {
    const [error] = this.createSubjectForm.name().errors();
    if (!error) {
      return '';
    }
    const { kind } = error;
    if (kind === ValidationKind.Required) {
      return this.translation()['NAME_REQUIRED'] ?? '';
    }
    return '';
  });

  protected submit(): void {
    if (!this.createSubjectForm().valid()) {
      this.createSubjectForm().markAsTouched();
      return;
    }
    this.dialogRef.close(this._model());
  }

  protected cancel(): void {
    this.dialogRef.close(undefined);
  }
}
