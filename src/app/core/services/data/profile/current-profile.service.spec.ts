import { ApplicationRef, provideZonelessChangeDetection, signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CurrentProfileService } from './current-profile.service';
import { ProfileService } from './profile.service';
import { AuthService } from '../../platform/auth.service';
import { InternalError } from '../../../errors/app-error';
import { err, ok } from '../../../types/result';
import type { Result } from '../../../types/result';
import type { Profile, UpdateProfileInput } from './profile.model';

const USER_ID: string = 'c7a1b2d3-4e5f-4a6b-8c9d-0e1f2a3b4c5d';

function buildProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: USER_ID,
    displayName: 'Eden Oren',
    avatarUrl: null,
    heightCm: 178,
    weightKg: null,
    dateOfBirth: '1996-04-12',
    createdAt: '2026-06-01T00:00:00.000Z',
    updatedAt: '2026-06-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('CurrentProfileService', () => {
  let userId: WritableSignal<string>;
  let getProfile: ReturnType<typeof vi.fn>;
  let updateProfile: ReturnType<typeof vi.fn>;

  function setUp(): CurrentProfileService {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: AuthService, useValue: { userId } },
        { provide: ProfileService, useValue: { getProfile, updateProfile } },
      ],
    });
    return TestBed.inject(CurrentProfileService);
  }

  async function settle(): Promise<void> {
    await TestBed.inject(ApplicationRef).whenStable();
  }

  beforeEach(() => {
    userId = signal('');
    getProfile = vi.fn(async (): Promise<Result<Profile>> => ok(buildProfile()));
    updateProfile = vi.fn(async (): Promise<Result<void>> => ok(undefined));
  });

  it('does not fetch until a session exists', async () => {
    const service: CurrentProfileService = setUp();

    service.profile();
    await settle();

    expect(getProfile).not.toHaveBeenCalled();
  });

  it('reads as loading while it waits for a session, rather than as an empty profile', async () => {
    const service: CurrentProfileService = setUp();

    await settle();

    expect(service.isLoading()).toBe(true);
    expect(service.hasError()).toBe(false);
    expect(service.profile()).toBeNull();
  });

  it('fetches once the session resolves', async () => {
    const service: CurrentProfileService = setUp();
    service.profile();
    await settle();

    userId.set(USER_ID);
    service.profile();
    await settle();

    expect(getProfile).toHaveBeenCalledWith(USER_ID);
    expect(service.profile()?.displayName).toBe('Eden Oren');
    expect(service.isLoading()).toBe(false);
  });

  it('exposes the display name and its initial for the account chip', async () => {
    userId.set(USER_ID);
    const service: CurrentProfileService = setUp();

    service.profile();
    await settle();

    expect(service.displayName()).toBe('Eden Oren');
    expect(service.initial()).toBe('E');
  });

  it('has no initial to show when the display name is empty', async () => {
    getProfile = vi.fn(async (): Promise<Result<Profile>> => ok(buildProfile({ displayName: '' })));
    userId.set(USER_ID);
    const service: CurrentProfileService = setUp();

    service.profile();
    await settle();

    expect(service.initial()).toBe('');
  });

  it('surfaces a failed fetch as an error instead of an endless load', async () => {
    getProfile = vi.fn(async (): Promise<Result<Profile>> => err(new InternalError('nope')));
    userId.set(USER_ID);
    const service: CurrentProfileService = setUp();

    service.profile();
    await settle();

    expect(service.hasError()).toBe(true);
    expect(service.isLoading()).toBe(false);
  });

  it('refetches after a save so every screen sees the new profile', async () => {
    userId.set(USER_ID);
    const service: CurrentProfileService = setUp();
    service.profile();
    await settle();
    getProfile.mockImplementation(async (): Promise<Result<Profile>> =>
      ok(buildProfile({ displayName: 'Renamed' })),
    );

    const input: UpdateProfileInput = { displayName: 'Renamed', dateOfBirth: null, heightCm: 180 };
    const result: Result<void> = await service.save(input);
    await settle();

    expect(result.success).toBe(true);
    expect(updateProfile).toHaveBeenCalledWith(USER_ID, input);
    expect(service.displayName()).toBe('Renamed');
  });

  it('keeps the loaded profile visible while a save refetches', async () => {
    userId.set(USER_ID);
    const service: CurrentProfileService = setUp();
    service.profile();
    await settle();

    const savePromise: Promise<Result<void>> = service.save({
      displayName: 'Renamed',
      dateOfBirth: null,
      heightCm: 180,
    });

    expect(service.isLoading()).toBe(false);
    await savePromise;
    await settle();
  });

  it('does not refetch when the save fails', async () => {
    updateProfile = vi.fn(async (): Promise<Result<void>> => err(new InternalError('nope')));
    userId.set(USER_ID);
    const service: CurrentProfileService = setUp();
    service.profile();
    await settle();
    const callsAfterLoad: number = getProfile.mock.calls.length;

    const result: Result<void> = await service.save({
      displayName: 'Renamed',
      dateOfBirth: null,
      heightCm: 180,
    });
    await settle();

    expect(result.success).toBe(false);
    expect(getProfile.mock.calls.length).toBe(callsAfterLoad);
  });
});
