import {
  ButtonType,
  InputType,
  SkeletonVariant,
  UiInputComponent,
  UiPageComponent,
  UiSkeletonComponent,
  ValidationKind,
} from '@edenoren/ui-kit';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  Signal,
  WritableSignal,
} from '@angular/core';
import { FieldTree, form, FormRoot, required } from '@angular/forms/signals';
import { ProfileFacade } from './profile.facade';
import type { Profile, UpdateProfileInput } from '../../core/services/data/profile/profile.model';

interface ProfileFormModel {
  displayName: string;
  dateOfBirth: string;
}

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ProfileFacade],
  imports: [FormRoot, UiInputComponent, UiPageComponent, UiSkeletonComponent],
})
export class ProfileComponent {
  protected readonly facade: ProfileFacade = inject(ProfileFacade);
  protected readonly skeletonVariant: typeof SkeletonVariant = SkeletonVariant;

  protected readonly inputType: typeof InputType = InputType;
  protected readonly buttonType: typeof ButtonType = ButtonType;

  private readonly _model: WritableSignal<ProfileFormModel> = signal({
    displayName: '',
    dateOfBirth: '',
  });

  readonly profileForm: FieldTree<ProfileFormModel> = form(this._model, (p) => {
    required(p.displayName);
  });

  private readonly _heightCm: WritableSignal<number | null> = signal(null);
  protected readonly heightCm: Signal<number | null> = this._heightCm;

  private loaded: boolean = false;

  readonly displayNameTouched: Signal<boolean> = computed(() =>
    this.profileForm.displayName().touched(),
  );

  readonly displayNameError: Signal<string> = computed(() => {
    const [error] = this.profileForm.displayName().errors();
    if (!error) {
      return '';
    }
    const { kind } = error;
    if (kind === ValidationKind.Required) {
      return this.facade.translation()['DISPLAY_NAME_REQUIRED'] ?? '';
    }
    return '';
  });

  constructor() {
    effect(() => {
      const profile: Profile | null = this.facade.profile();
      if (profile && !this.loaded) {
        this.loaded = true;
        this._model.set({
          displayName: profile.displayName,
          dateOfBirth: profile.dateOfBirth ?? '',
        });
        this._heightCm.set(profile.heightCm);
      }
    });
  }

  protected onHeightChange(value: number | null): void {
    this._heightCm.set(value);
  }

  protected onSave(): void {
    if (!this.profileForm().valid()) {
      this.profileForm().markAsTouched();
      return;
    }
    const { displayName, dateOfBirth } = this._model();
    const input: UpdateProfileInput = {
      displayName,
      dateOfBirth: dateOfBirth || null,
      heightCm: this._heightCm(),
    };
    void this.facade.saveProfile(input);
  }
}
