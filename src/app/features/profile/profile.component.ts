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
import { DatePipe } from '@angular/common';
import {
  FieldTree,
  form,
  FormRoot,
  max,
  maxLength,
  min,
  minLength,
  required,
  validate,
} from '@angular/forms/signals';
import type { ValidationError } from '@angular/forms/signals';
import { ProfileFacade } from './profile.facade';
import { ProfileValidationKind } from './enums/profile-validation-kind.enum';
import { UserAvatarComponent } from '../../shared/components/user-avatar/user-avatar.component';
import { UserAvatarSize } from '../../shared/enums/user-avatar-size.enum';
import { calculateAge, toLocalDateString } from '../../shared/utils/date';
import {
  DISPLAY_NAME_MAX_LENGTH,
  DISPLAY_NAME_MIN_LENGTH,
} from '../../shared/constants/display-name.const';
import type { Profile, UpdateProfileInput } from '../../core/services/data/profile/profile.model';

interface ProfileFormModel {
  displayName: string;
  dateOfBirth: string;
  heightCm: number | null;
}

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ProfileFacade],
  imports: [
    DatePipe,
    FormRoot,
    UiInputComponent,
    UiPageComponent,
    UiSkeletonComponent,
    UserAvatarComponent,
  ],
})
export class ProfileComponent {
  private static readonly HEIGHT_MIN_CM: number = 50;
  private static readonly HEIGHT_MAX_CM: number = 300;
  // Without a floor a typed `0001-01-01` validates and reports an age of 2025.
  // Enforced here rather than as a native `min`, which ui-kit's date input has
  // no binding for.
  private static readonly DATE_OF_BIRTH_MIN: string = '1900-01-01';

  protected readonly facade: ProfileFacade = inject(ProfileFacade);
  protected readonly buttonType: typeof ButtonType = ButtonType;
  protected readonly inputType: typeof InputType = InputType;
  protected readonly skeletonVariant: typeof SkeletonVariant = SkeletonVariant;
  protected readonly userAvatarSize: typeof UserAvatarSize = UserAvatarSize;

  private readonly _model: WritableSignal<ProfileFormModel> = signal({
    displayName: '',
    dateOfBirth: '',
    heightCm: null,
  });

  readonly profileForm: FieldTree<ProfileFormModel> = form(this._model, (path) => {
    required(path.displayName);
    minLength(path.displayName, DISPLAY_NAME_MIN_LENGTH);
    maxLength(path.displayName, DISPLAY_NAME_MAX_LENGTH);
    min(path.heightCm, ProfileComponent.HEIGHT_MIN_CM);
    max(path.heightCm, ProfileComponent.HEIGHT_MAX_CM);
    validate(path.dateOfBirth, ({ value }) => ProfileComponent.validateDateOfBirth(value()));
  });

  private loaded: boolean = false;

  protected readonly displayNameTouched: Signal<boolean> = computed(() =>
    this.profileForm.displayName().touched(),
  );

  protected readonly heightTouched: Signal<boolean> = computed(() =>
    this.profileForm.heightCm().touched(),
  );

  protected readonly dateOfBirthTouched: Signal<boolean> = computed(() =>
    this.profileForm.dateOfBirth().touched(),
  );

  protected readonly displayNameError: Signal<string> = computed(() => {
    const [error] = this.profileForm.displayName().errors();
    const labels: Record<string, string> = this.facade.translation();
    if (!error) {
      return '';
    }
    if (error.kind === ValidationKind.Required) {
      return labels['DISPLAY_NAME_REQUIRED'] ?? '';
    }
    if (error.kind === ValidationKind.MinLength) {
      return labels['DISPLAY_NAME_TOO_SHORT'] ?? '';
    }
    if (error.kind === ValidationKind.MaxLength) {
      return labels['DISPLAY_NAME_TOO_LONG'] ?? '';
    }
    return '';
  });

  protected readonly heightError: Signal<string> = computed(() => {
    const [error] = this.profileForm.heightCm().errors();
    const labels: Record<string, string> = this.facade.translation();
    if (!error) {
      return '';
    }
    // A number input holding unparseable text raises `parse` where the old
    // value-bound control silently produced null.
    if (error.kind === ValidationKind.Parse) {
      return labels['HEIGHT_INVALID_ERROR'] ?? '';
    }
    if (error.kind === ValidationKind.Min || error.kind === ValidationKind.Max) {
      return labels['HEIGHT_RANGE_ERROR'] ?? '';
    }
    return '';
  });

  protected readonly dateOfBirthError: Signal<string> = computed(() => {
    const [error] = this.profileForm.dateOfBirth().errors();
    const labels: Record<string, string> = this.facade.translation();
    if (error?.kind === ProfileValidationKind.DateOfBirthFuture) {
      return labels['DATE_OF_BIRTH_FUTURE_ERROR'] ?? '';
    }
    if (error?.kind === ProfileValidationKind.DateOfBirthTooEarly) {
      return labels['DATE_OF_BIRTH_TOO_EARLY_ERROR'] ?? '';
    }
    return '';
  });

  protected readonly age: Signal<number | null> = computed(() =>
    calculateAge(this._model().dateOfBirth, new Date()),
  );

  // Nothing to save until something changes, and a fresh baseline after each
  // save puts the button back to sleep.
  protected readonly canSave: Signal<boolean> = computed(
    () => this.profileForm().dirty() && !this.facade.isSaving(),
  );

  constructor() {
    effect(() => {
      const profile: Profile | null = this.facade.profile();
      if (profile && !this.loaded) {
        this.loaded = true;
        this.profileForm().reset({
          displayName: profile.displayName,
          dateOfBirth: profile.dateOfBirth ?? '',
          heightCm: profile.heightCm,
        });
      }
    });
  }

  protected async onSave(): Promise<void> {
    if (!this.profileForm().valid()) {
      this.profileForm().markAsTouched();
      return;
    }
    const { displayName, dateOfBirth, heightCm } = this._model();
    const input: UpdateProfileInput = {
      displayName,
      dateOfBirth: dateOfBirth || null,
      heightCm,
    };
    const saved: boolean = await this.facade.saveProfile(input);
    if (saved) {
      this.profileForm().reset(this._model());
    }
  }

  protected onChangePassword(): void {
    void this.facade.sendPasswordResetEmail();
  }

  private static validateDateOfBirth(value: string): ValidationError | null {
    if (!value) {
      return null;
    }
    // ISO date strings sort chronologically, so plain comparison is enough.
    if (value > toLocalDateString(new Date())) {
      return { kind: ProfileValidationKind.DateOfBirthFuture };
    }
    if (value < ProfileComponent.DATE_OF_BIRTH_MIN) {
      return { kind: ProfileValidationKind.DateOfBirthTooEarly };
    }
    return null;
  }
}
