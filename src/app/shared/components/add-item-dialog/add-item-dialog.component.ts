import { ButtonVariant, InputType, UiButtonComponent, UiInputComponent, UiModalComponent, ValidationKind } from '@edenoren/ui-kit';
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
  private readonly translateService: TranslateService = inject(TranslateService);

  protected readonly inputType: typeof InputType = InputType;
  protected readonly buttonVariant: typeof ButtonVariant = ButtonVariant;

  readonly submitted: OutputEmitterRef<string> = output<string>();
  readonly closed: OutputEmitterRef<void> = output<void>();

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

  protected onSubmit(): void {
    if (!this.addItemForm().valid()) {
      this.addItemForm().markAsTouched();
      return;
    }
    this.submitted.emit(this._model().name.trim());
  }

  protected onClose(): void {
    this.closed.emit();
  }
}
