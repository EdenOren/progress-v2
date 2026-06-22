import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  output,
  OutputEmitterRef,
  Signal,
  signal,
  WritableSignal,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FieldTree, form, FormRoot, required } from '@angular/forms/signals';
import { UiButtonComponent } from '../ui-button/ui-button.component';
import { UiInputComponent } from '../ui-input/ui-input.component';
import { UiModalComponent } from '../ui-modal/ui-modal.component';
import { ButtonVariant } from '../../enums/button-variant.enum';
import { InputType } from '../../enums/input-type.enum';
import { ValidationKind } from '../../enums/validation-kind.enum';

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
  imports: [UiModalComponent, UiButtonComponent, FormRoot, UiInputComponent],
})
export class CreateSubjectDialogComponent {
  static readonly DIALOG_WIDTH: string = '360px';

  private readonly translateService: TranslateService = inject(TranslateService);

  protected readonly inputType: typeof InputType = InputType;
  protected readonly buttonVariant: typeof ButtonVariant = ButtonVariant;

  readonly submitted: OutputEmitterRef<CreateSubjectFormData> = output<CreateSubjectFormData>();
  readonly closed: OutputEmitterRef<void> = output<void>();

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

  protected onSubmit(): void {
    if (!this.createSubjectForm().valid()) {
      this.createSubjectForm().markAsTouched();
      return;
    }
    this.submitted.emit(this._model());
  }

  protected onClose(): void {
    this.closed.emit();
  }
}
