import { computed, inject, ResourceRef, Service, Signal, signal, WritableSignal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslateService } from '@ngx-translate/core';
import { resource } from '@angular/core';
import { AuthService } from '../../core/services/platform/auth.service';
import { ProfileService } from '../../core/services/data/profile/profile.service';
import type { Profile, UpdateProfileInput } from '../../core/services/data/profile/profile.model';
import type { Result } from '../../core/types/result';

@Service({ autoProvided: false })
export class ProfileFacade {
  private readonly profileService: ProfileService = inject(ProfileService);
  private readonly authService: AuthService = inject(AuthService);
  private readonly translateService: TranslateService = inject(TranslateService);

  readonly translation: Signal<Record<string, string>> = toSignal(
    this.translateService.stream('PROFILE'),
    { initialValue: {} as Record<string, string> },
  );

  private readonly _profileResource: ResourceRef<Result<Profile> | undefined> = resource({
    params: () => ({ userId: this.authService.userId() }),
    loader: ({ params }) => this.profileService.getProfile(params.userId),
  });

  readonly isLoading: Signal<boolean> = computed(() => this._profileResource.isLoading());

  readonly hasError: Signal<boolean> = computed(() => {
    const result = this._profileResource.value();
    return !!result && !result.success;
  });

  readonly profile: Signal<Profile | null> = computed(() => {
    const result = this._profileResource.value();
    if (!result?.success) {
      return null;
    }
    return result.data;
  });

  private readonly _saveSuccess: WritableSignal<boolean> = signal(false);
  private readonly _saveError: WritableSignal<boolean> = signal(false);

  readonly saveSuccess: Signal<boolean> = this._saveSuccess;
  readonly saveError: Signal<boolean> = this._saveError;

  async saveProfile(input: UpdateProfileInput): Promise<void> {
    this._saveSuccess.set(false);
    this._saveError.set(false);
    const result: Result<void> = await this.profileService.updateProfile(
      this.authService.userId(),
      input,
    );
    if (!result.success) {
      this._saveError.set(true);
      return;
    }
    this._saveSuccess.set(true);
    this._profileResource.reload();
  }
}
