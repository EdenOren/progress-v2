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
import { TranslateService } from '@ngx-translate/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FieldTree, form, FormRoot, required } from '@angular/forms/signals';
import { UiButtonComponent } from '../../../../shared/components/ui-button/ui-button.component';
import { UiInputComponent } from '../../../../shared/components/ui-input/ui-input.component';
import { UiModalComponent } from '../../../../shared/components/ui-modal/ui-modal.component';
import { ButtonVariant } from '../../../../shared/enums/button-variant.enum';
import { InputType } from '../../../../shared/enums/input-type.enum';
import { ValidationKind } from '../../../../shared/enums/validation-kind.enum';

interface AddItemModel {
  name: string;
}

@Component({
  selector: 'app-add-item-dialog',
  templateUrl: './add-item-dialog.component.html',
  styleUrl: './add-item-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiModalComponent, UiButtonComponent, FormRoot, UiInputComponent],
})
export class AddItemDialogComponent {
  static readonly DIALOG_WIDTH: string = '360px';

  private readonly dialogRef: MatDialogRef<AddItemDialogComponent, string> = inject(
    MatDialogRef<AddItemDialogComponent, string>,
  );
  private readonly translateService: TranslateService = inject(TranslateService);

  protected readonly inputType: typeof InputType = InputType;
  protected readonly buttonVariant: typeof ButtonVariant = ButtonVariant;

  readonly translation: Signal<Record<string, string>> = toSignal(
    this.translateService.stream('ENTRY'),
    { initialValue: {} as Record<string, string> },
  );

  private readonly _model: WritableSignal<AddItemModel> = signal({ name: '' });

  readonly addItemForm: FieldTree<AddItemModel> = form(this._model, (fields) => {
    required(fields.name);
  });

  readonly nameTouched: Signal<boolean> = computed(() => this.addItemForm.name().touched());

  readonly nameError: Signal<string> = computed(() => {
    const [error] = this.addItemForm.name().errors();
    if (!error) {
      return '';
    }
    const { kind } = error;
    if (kind === ValidationKind.Required) {
      return this.translation()['EXERCISE_NAME_REQUIRED'] ?? '';
    }
    return '';
  });

  protected submit(): void {
    if (!this.addItemForm().valid()) {
      this.addItemForm().markAsTouched();
      return;
    }
    this.dialogRef.close(this._model().name.trim());
  }

  protected cancel(): void {
    this.dialogRef.close(undefined);
  }
}
