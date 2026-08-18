import { computed, inject, resource, ResourceRef, Service, Signal } from '@angular/core';
import { AuthService } from '../../platform/auth.service';
import { ProfileService } from './profile.service';
import type { Profile, UpdateProfileInput } from './profile.model';
import type { Result } from '../../../types/result';

interface CurrentProfileParams {
  userId: string;
}

/**
 * The signed-in user's profile, held once for every screen that needs it. Two
 * consumers — the Profile screen and the shell's account chip — would otherwise
 * fetch separately and drift apart the moment one of them saves.
 */
@Service()
export class CurrentProfileService {
  private readonly profileService: ProfileService = inject(ProfileService);
  private readonly authService: AuthService = inject(AuthService);

  private readonly _profileResource: ResourceRef<Result<Profile> | undefined> = resource({
    // Undefined params hold the resource idle. `userId()` is '' until the session
    // resolves, and fetching on that returns an error the user briefly sees.
    params: (): CurrentProfileParams | undefined => {
      const userId: string = this.authService.userId();
      if (!userId) {
        return undefined;
      }
      return { userId };
    },
    loader: ({ params }) => this.profileService.getProfile(params.userId),
  });

  readonly profile: Signal<Profile | null> = computed(() => {
    const result: Result<Profile> | undefined = this._profileResource.value();
    if (!result?.success) {
      return null;
    }
    return result.data;
  });

  readonly hasError: Signal<boolean> = computed(() => {
    const result: Result<Profile> | undefined = this._profileResource.value();
    return !!result && !result.success;
  });

  /**
   * Idle reads as loading: waiting for a session is still waiting, and the
   * alternative is an empty form flashing before the profile arrives. A reload
   * keeps the previous profile, so saving doesn't throw the screen back to
   * skeletons.
   */
  readonly isLoading: Signal<boolean> = computed(() => !this.profile() && !this.hasError());

  readonly displayName: Signal<string> = computed(() => this.profile()?.displayName ?? '');

  readonly initial: Signal<string> = computed(() => {
    const [firstCharacter] = this.displayName();
    if (!firstCharacter) {
      return '';
    }
    return firstCharacter.toUpperCase();
  });

  reload(): void {
    this._profileResource.reload();
  }

  async save(input: UpdateProfileInput): Promise<Result<void>> {
    const result: Result<void> = await this.profileService.updateProfile(
      this.authService.userId(),
      input,
    );
    if (result.success) {
      this._profileResource.reload();
    }
    return result;
  }
}
