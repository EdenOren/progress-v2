# Phase 11a — Security: New Device Detection

**Branch:** `feature/25-security-device-detection`
**Target:** `development`

---

## Context

Phase 11 (Security) has two parts per the backlog: (1) new-device detection + alerts, (2) email notification on account changes (password reset, email change). Per user decision, this phase covers **device detection only** — account-change emails are deferred to a later phase.

Email provider: **Brevo** (user decision — switched from an initial Resend pick after discovering the user has no owned domain to verify; Brevo's single-sender verification works with just a personal email address, no DNS/domain required, and has no sandbox recipient restriction).

No native Supabase "Auth Hook on sign-in" is used — that feature requires dashboard/Postgres-webhook configuration outside this repo and doesn't reliably expose IP/User-Agent. Instead, the Angular client explicitly invokes a Supabase Edge Function right after a real sign-in event (`onAuthStateChange` fires `SIGNED_IN` only on an actual new sign-in, not on session restore/refresh — confirmed against supabase-js v2 semantics). The Edge Function reads the real client IP from the request (`x-forwarded-for`, set by Supabase's edge proxy — not spoofable by the browser the way a body field would be) and the User-Agent header, so the client cannot lie about either.

---

## Design decisions

- **Fingerprint = hash(user_id + user_agent) only, IP excluded from the identity key.** IP changes constantly (mobile networks, VPNs, wifi hopping) and would cause false "new device" alerts on the same browser. IP is still recorded per-row for the alert email's context, just not part of what defines a "known device."
- **One row per known device per user** in `user_sessions`, upserted on every sign-in: new fingerprint → insert + alert; known fingerprint → update `last_seen_at`/`last_ip_address` only, no alert.
- **Edge Function does the fingerprinting and email, not the Angular client.** The client only provides nothing extra — user-agent and IP both come from the request itself, so there's no client-supplied identity data to validate/trust.
- **RLS-scoped client, not service-role, for the DB write.** The Edge Function forwards the caller's JWT to a Supabase client using the anon key, so `auth.uid()` in RLS policies resolves normally — no service-role key needed for `user_sessions` access. Brevo's API key is a separate Edge Function secret, unrelated to Supabase roles.
- **Email failure never blocks device recording.** If Brevo's API call fails, the function logs the error, still returns `isNewDevice: true` so the in-app banner shows — recording the device and surfacing an in-app signal is the reliable channel; email is best-effort.
- **In-app alert is a dismissible banner in `HomeComponent`**, not a new shared component. There's no existing toast/banner primitive in `shared/components/`, and one banner in one place doesn't justify building an abstraction (matches the "no premature abstraction" rule). It reads `authService.isNewDevice()` and calls `authService.acknowledgeNewDevice()` on dismiss.
- **Trigger point is `AuthService`**, since it already owns the `onAuthStateChange` subscription and session state. It injects `DeviceSessionService` (a plain Result-returning data service with no dependency on `AuthService`, so no circular dependency) and calls `recordSession()` only on the `SupabaseAuthEvent.SignedIn` event.
- **New enum `SupabaseAuthEvent`** (`core/enums/`) mirrors the one supabase-js `AuthChangeEvent` string value this code actually compares against (`SIGNED_IN`), per the no-string-literal-comparison rule. Not exhaustive of every possible event — only the one branch this code needs.

---

## Files to Create / Modify

### Commit 1 — DB migration

| File | Action |
|------|--------|
| `supabase/migrations/016_user_sessions.sql` | Create |

```sql
create table if not exists public.user_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  fingerprint_hash text not null,
  user_agent text not null,
  last_ip_address text not null,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  unique (user_id, fingerprint_hash)
);

alter table public.user_sessions enable row level security;

create policy "user_sessions_select_own" on public.user_sessions
  for select using (auth.uid() = user_id);

create policy "user_sessions_insert_own" on public.user_sessions
  for insert with check (auth.uid() = user_id);

create policy "user_sessions_update_own" on public.user_sessions
  for update using (auth.uid() = user_id);
```

User runs this on Supabase (per existing migration convention — no local Supabase CLI project is configured in this repo).

---

### Commit 2 — Edge Function

| File | Action |
|------|--------|
| `supabase/functions/record-device-session/index.ts` | Create |

Behavior:
1. Read `Authorization` header (forwarded automatically by `supabase.functions.invoke()`), create a Supabase client with the **anon key** + that header so `auth.uid()` resolves under RLS.
2. Call `supabase.auth.getUser()` to get `user.id` and `user.email`.
3. Read `user-agent` and `x-forwarded-for` (first IP) from the incoming request headers.
4. Compute `fingerprintHash = sha256(user.id + '|' + userAgent)` via `crypto.subtle.digest`.
5. `select` from `user_sessions` for `(user_id, fingerprint_hash)`.
   - **Found:** `update` `last_seen_at`/`last_ip_address`, respond `{ isNewDevice: false }`.
   - **Not found:** `insert` the new row, attempt a Brevo email to `user.email` (subject/body: sign-in time, browser/OS from user-agent, IP), swallow/log any Brevo error, respond `{ isNewDevice: true }`.
6. Any DB error → respond with a 500 and an error body; the client maps this to `NetworkError` and does not block sign-in.

Manual setup (documented here, not run by this repo): deploy the function (`supabase functions deploy record-device-session`) and set secrets `BREVO_API_KEY` and `BREVO_FROM_EMAIL` (`supabase secrets set ...`). Requires a Brevo account with a single-sender email verified (Settings → Senders → add + verify via confirmation link) — no domain/DNS needed.

---

### Commit 3 — Angular data layer

| File | Action |
|------|--------|
| `src/app/core/enums/supabase-auth-event.enum.ts` | Create |
| `src/app/core/services/data/device-session.service.ts` | Create |
| `src/app/core/services/platform/auth.service.ts` | Extend |

**`supabase-auth-event.enum.ts`**
```ts
export enum SupabaseAuthEvent {
  SignedIn = 'SIGNED_IN',
}
```

**`device-session.service.ts`**
```ts
export interface DeviceSessionResult {
  isNewDevice: boolean;
}

@Service()
export class DeviceSessionService {
  private readonly supabase: SupabaseClient = inject(SupabaseService).client;

  async recordSession(): Promise<Result<DeviceSessionResult>> {
    const { data, error } = await this.supabase.functions.invoke('record-device-session');
    if (error) {
      return err(new NetworkError(error.message));
    }
    const validated = deviceSessionResultSchema.safeParse(data);
    if (!validated.success) {
      return err(new ValidationError('Invalid device session response'));
    }
    return ok(validated.data);
  }
}
```
(Zod schema `deviceSessionResultSchema = z.object({ isNewDevice: z.boolean() })` colocated in the same file, matching the existing service pattern.)

**`auth.service.ts` changes:**
- Inject `DeviceSessionService`.
- Add `_isNewDevice: WritableSignal<boolean>` + public `isNewDevice: Signal<boolean>`.
- Add `acknowledgeNewDevice(): void` → `this._isNewDevice.set(false)`.
- In the `onAuthStateChange` callback: when `event === SupabaseAuthEvent.SignedIn`, call `this.deviceSessionService.recordSession()` and set `_isNewDevice` from the result (`isOk(result) && result.data.isNewDevice`). Fire-and-forget (no `await` in the sync callback) but handle the promise explicitly (`.then()`), never `.catch()`-swallow silently — log failure via existing error-mapping conventions.

---

### Commit 4 — In-app banner

| File | Action |
|------|--------|
| `src/assets/i18n/en.json` | Add `SECURITY` section |
| `src/app/features/home/home.component.ts` | Extend |
| `src/app/features/home/home.component.html` | Extend |
| `src/app/features/home/home.component.scss` | Extend |

**`en.json` additions:**
```json
"SECURITY": {
  "NEW_DEVICE_ALERT_MESSAGE": "We noticed a sign-in from a new device. If this wasn't you, reset your password immediately.",
  "NEW_DEVICE_ALERT_DISMISS": "Dismiss"
}
```

**`home.component.ts`**: inject `AuthService`, expose `isNewDevice: Signal<boolean>` (delegates to `authService.isNewDevice`), add `dismissDeviceAlert(): void` calling `authService.acknowledgeNewDevice()`.

**`home.component.html`**: `@if (isNewDevice()) { <div class="home__device-alert">...<app-ui-button (click)="dismissDeviceAlert()">...</app-ui-button></div> }` placed above `<router-outlet>`, translated via the existing `stream()`-based i18n pattern used elsewhere.

---

## Out of scope

- Account-change email notifications (password reset, email change) — separate slice, deferred per user decision.
- Provisioning the actual Brevo account/sender and deploying the Edge Function — manual steps the user runs outside this repo, same as DB migrations.
- A "manage known devices" UI (list/revoke `user_sessions` rows) — not requested, would be natural future follow-up.
- `015_simplify_settings.sql` — unrelated pending migration, not part of this phase.

---

## Verification

1. `ng build` passes after each commit.
2. After migration + function deploy: sign in from a browser/profile never used with this account before → confirm a new `user_sessions` row appears, an email arrives via Brevo, and the in-app banner shows on next load.
3. Sign out and back in from the same browser → confirm no new row, no email, no banner (only `last_seen_at`/`last_ip_address` update).
4. Dismiss the banner → confirm it doesn't reappear until the next genuinely new device sign-in.
5. Temporarily break the Edge Function (e.g. bad secret) → confirm sign-in still succeeds and doesn't hang; `NetworkError` is surfaced only in logs, not blocking auth.
