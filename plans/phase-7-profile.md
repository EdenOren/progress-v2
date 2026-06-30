# Phase 7 — Profile

**Branch:** `feature/7-profile`  
**Target:** `development`

---

## Goal

Editable user profile page accessible from the Menu tab. Fields: display name, date of birth, height. Requires one DB migration to add `date_of_birth` to the `profiles` table.

---

## DB Migration (user runs on Supabase)

**File:** `supabase/migrations/013_expand_profiles.sql`

```sql
ALTER TABLE profiles ADD COLUMN date_of_birth DATE;
```

No RLS changes needed — existing policies on `profiles` cover the new column.

---

## Files to Create / Modify

### Commit 1 — Data layer

| File | Action |
|------|--------|
| `supabase/migrations/013_expand_profiles.sql` | Create |
| `src/app/core/services/data/profile/profile.model.ts` | Create |
| `src/app/core/services/data/profile/profile.service.ts` | Create |
| `src/assets/i18n/en.json` | Add PROFILE section |

**`profile.model.ts`** — three exported interfaces:

```ts
export interface ProfileRaw {
  id: string;
  display_name: string;
  avatar_url: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  date_of_birth: string | null;  // ISO date "YYYY-MM-DD" or null
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  heightCm: number | null;
  weightKg: number | null;
  dateOfBirth: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileInput {
  displayName: string;
  dateOfBirth: string | null;
  heightCm: number | null;
}
```

**`profile.service.ts`** — `@Service()` class (root singleton) that injects `SupabaseService`:

```ts
@Service()
export class ProfileService {
  private readonly supabase: SupabaseClient = inject(SupabaseService).client;

  async getProfile(userId: string): Promise<Result<Profile>> { ... }
  async updateProfile(userId: string, input: UpdateProfileInput): Promise<Result<void>> { ... }
}
```

Zod schema:
```ts
const profileSchema: z.ZodType<ProfileRaw> = z.object({
  id: z.string().uuid(),
  display_name: z.string(),
  avatar_url: z.string().nullable(),
  height_cm: z.number().nullable(),
  weight_kg: z.number().nullable(),
  date_of_birth: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});
```

Mapping function: `function mapProfile(raw: ProfileRaw): Profile { ... }` (snake_case → camelCase).

**en.json PROFILE keys:**
```json
"PROFILE": {
  "DISPLAY_NAME": "Display name",
  "DATE_OF_BIRTH": "Date of birth",
  "HEIGHT": "Height (cm)",
  "SAVE": "Save",
  "SAVE_SUCCESS": "Profile saved",
  "SAVE_ERROR": "Failed to save profile"
}
```

---

### Commit 2 — Route + shell wiring

| File | Action |
|------|--------|
| `src/app/core/enums/app-route.enum.ts` | Add `Profile = 'profile'` |
| `src/app/app.routes.ts` | Add lazy route under shell children |
| `src/app/features/profile/profile.component.ts` | Create stub |
| `src/app/features/profile/profile.facade.ts` | Create stub |
| `src/app/features/menu/menu.component.ts` | Add Profile link |

**Route entry** (child of shell):
```ts
{ path: AppRoute.Profile, loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent) }
```

**MenuComponent** gains `protected onNavigateToProfile(): void` (inject `Router`) and renders an `<app-ui-button>` that calls it. Menu is now a real component with a `MenuFacade` (`@Service({ autoProvided: false })`).

---

### Commit 3 — Profile form

| File | Action |
|------|--------|
| `src/app/features/profile/profile.facade.ts` | Full implementation |
| `src/app/features/profile/profile.component.ts` | Full Signal Form |

**ProfileFacade** (`@Service({ autoProvided: false })`):

```ts
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
    if (!result?.success) { return null; }
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
```

**ProfileComponent**:

Form model (all strings — Signal Forms only tracks string fields):
```ts
interface ProfileFormModel {
  displayName: string;
  dateOfBirth: string;
}
```

Height is a number → handled separately with `WritableSignal<number | null>` (matches `UiInputComponent`'s `[value]` + `(valueChange)` number pattern):
```ts
private readonly _heightCm: WritableSignal<number | null> = signal(null);
protected readonly heightCm: Signal<number | null> = this._heightCm;
```

Pre-fill via `effect()` with a `loaded` boolean guard:
```ts
private loaded: boolean = false;

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
```

On save:
```ts
protected onSave(): void {
  if (!this.profileForm().valid()) {
    this.profileForm().markAsTouched();
    return;
  }
  const { displayName, dateOfBirth } = this._model();
  void this.facade.saveProfile({
    displayName,
    dateOfBirth: dateOfBirth || null,
    heightCm: this._heightCm(),
  });
}
```

No `<h1>` or `<header>` in the template — page goes straight to content per project convention.

---

## Form field summary

| Field | Signal Form? | UiInput binding |
|-------|-------------|----------------|
| display_name | Yes — `Field<string>`, `required()` | `[field]="profileForm.displayName()"` |
| date_of_birth | Yes — `Field<string>`, no validators | `[field]="profileForm.dateOfBirth()"` with `type="date"` |
| height_cm | No — `WritableSignal<number\|null>` | `[value]="heightCm()"` `(valueChange)="onHeightChange($event)"` |

---

## Routing note

Profile is a peer of Progress / DailyLog / KPI / Menu under the shell — not nested inside any tab. Bottom nav stays visible.

---

## Out of scope

- Avatar upload (requires Supabase Storage)
- `weight_kg` on profiles (tracked in `daily_log_entries`)
- Phase 2b auth extensions (forgot/reset password) — deferred
