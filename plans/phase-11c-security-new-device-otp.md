# Phase 11c — Security: Block New-Device Login Behind Email OTP

**Branch:** `feature/26-security-new-device-otp` (proposed — not yet created)
**Target:** `development`

---

## Context

Phase 11a (`feature/25-security-device-detection`, code complete, tested working) only **alerts** on a new-device sign-in — it never blocks the sign-in itself. The user now wants an actual block: password sign-in from an unrecognised device must not succeed until the user enters a one-time code emailed to them.

This is a materially bigger change than 11a: it changes the trust model of the login flow itself, introduces the Supabase **service-role key** as an Edge Function secret for the first time in this repo, and adds a genuinely new question — *what does "block" mean when Supabase issues session tokens as soon as a password check succeeds?*

---

## Key design decision: withhold tokens, don't just gate the UI

There are two ways to implement "block until OTP":

1. **App-level gate (weaker):** let `supabase.auth.signInWithPassword()` run as today, get a real session, but have an Angular route guard refuse to show any feature route until OTP passes. The problem: a valid Supabase JWT already exists in the browser the moment password auth succeeds — anyone who inspects `localStorage` or replays that token directly against the Supabase REST API bypasses the Angular-level gate entirely. This is not a real block, just a UI inconvenience.
2. **Token withholding (chosen):** never let the *browser* obtain the password grant directly. Route the password check through a new Edge Function that calls `signInWithPassword` **server-side** using the anon key (identical trust level to what the browser does today — no elevated privilege for that step). If the device is known, the function immediately returns the resulting `access_token`/`refresh_token` to the browser, which calls `supabase.auth.setSession()` — transparent, same UX as today. If the device is unknown, the function stores those tokens server-side against a short-lived OTP challenge row and returns **only a `challengeId`, no tokens** — the browser has no working credential until a second Edge Function verifies the code and hands the tokens back. There is no half-authenticated state to bypass, because no session exists in the browser at all until OTP succeeds.

Approach 2 is the one this plan implements. It requires a new table (`login_otp_challenges`) that is **never** reachable via a normal user JWT — only the two new Edge Functions touch it, using the Supabase-provided `SUPABASE_SERVICE_ROLE_KEY` (auto-injected into every Edge Function's environment by the platform — no manual secret to set). `user_sessions` (from 11a) keeps its existing user-scoped RLS; these functions use the service-role client for it too, purely for implementation simplicity, since by the time they touch it the password has already been verified.

---

## Scope boundary — password sign-in only

This OTP gate applies **only** to `AuthService.signInWithEmail()` (the password login path). Explicitly out of scope, and why:

- **Google OAuth sign-in** — the code-exchange happens directly between the browser and Supabase after the OAuth redirect; there is no point in this repo's control flow to intercept it before a session exists without rebuilding the OAuth callback entirely. It keeps using the existing Phase 11a passive alert-only detection (`record-device-session`, still invoked from `AuthService`'s `onAuthStateChange` handler).
- **Signup** (`signUpWithEmail`) — a brand-new account has no prior trusted device to compare against; forcing OTP here is meaningless. Unchanged.
- **Password reset session** (`ResetPasswordComponent`'s recovery flow) — established via Supabase's own recovery-token exchange, not through `signInWithEmail`. Unchanged, stays on the passive alert path.

A side effect worth knowing: once the gated password flow calls `setSession()`, that still fires `onAuthStateChange`'s `SIGNED_IN` event, which still calls the old passive `record-device-session` function from 11a. That call becomes a harmless no-op for password logins (the device row was already written by the OTP verification step), and remains the only device-tracking mechanism for Google OAuth. Not worth special-casing to suppress.

---

## Design decisions

- **6-digit numeric code**, generated with `crypto.getRandomValues` (not `Math.random`), hashed with SHA-256 before storage — the raw code is never persisted, only emailed.
- **120-minute expiry**, **5 wrong-attempt cap** before the challenge is invalidated and the user must restart sign-in (re-enter password). The attempt cap is what actually bounds brute force here — a 6-digit space (1,000,000 combinations) would otherwise be reachable well within a 120-minute window, so the cap matters more than it would with a short-lived code.
- **Resend capability** with a 60-second cooldown (`last_sent_at` column) — reuses the same challenge row, issues a fresh code + expiry, resets the attempt counter.
- **`login_otp_challenges` has zero RLS policies** (RLS enabled, no policies = deny-all for every non-service-role caller). This is deliberate: unlike `user_sessions` (where a future "manage known devices" UI might reasonably let a user query their own rows), nothing should ever read this table except the two Edge Functions that manage the login handshake.
- **New `LoginStatus` enum** (`Success` / `OtpRequired`) — per the no-string-literal-comparison rule — used as the discriminant on `AuthService.signInWithEmail()`'s new return shape.
- **Pending challenge ID lives on `AuthService`**, not router state or a query param. A `WritableSignal<string | null>` avoids leaking the ID into browser history/URL and avoids Angular router-state fragility (state is lost on refresh — which is fine here: refreshing mid-verification should force the user to restart sign-in, not resume silently).
- **New `deviceVerificationPendingGuard`** on the `verify-device` route — checks `authService.pendingOtpChallengeId() !== null`; a direct navigation or refresh with no pending challenge redirects to `/auth/login`, mirroring the existing `authGuard`/`guestGuard` pattern already in this codebase.
- **OTP email reuses the Brevo integration** from 11a (same secrets, same API), with a new subject/body template — not a security alert, just "here is your code."

---

## Files to Create / Modify

### Commit 1 — DB migration

| File | Action |
|------|--------|
| `supabase/migrations/017_login_otp_challenges.sql` | Create |

```sql
create table if not exists public.login_otp_challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  fingerprint_hash text not null,
  user_agent text not null,
  ip_address text not null,
  code_hash text not null,
  access_token text not null,
  refresh_token text not null,
  attempt_count int not null default 0,
  last_sent_at timestamptz not null default now(),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

alter table public.login_otp_challenges enable row level security;
-- Intentionally no policies — only the service-role key (used inside
-- login-with-device-check / verify-device-otp / resend-device-otp
-- Edge Functions) may touch this table. No user JWT should ever reach it.
```

---

### Commit 2 — Edge Functions

| File | Action |
|------|--------|
| `supabase/functions/login-with-device-check/index.ts` | Create |
| `supabase/functions/verify-device-otp/index.ts` | Create |
| `supabase/functions/resend-device-otp/index.ts` | Create |

**`login-with-device-check`**
1. Parse `{ email, password }` from the body.
2. Anon-key client → `auth.signInWithPassword({ email, password })`. Error → 401 (same message shape the client already maps via `mapSupabaseAuthError`).
3. Compute `fingerprintHash` exactly as in 11a's `record-device-session` (`sha256(user.id + '|' + userAgent)`), reading `user-agent`/`x-forwarded-for` off the request.
4. Service-role client checks `user_sessions` for `(user_id, fingerprint_hash)`:
   - **Found:** update `last_seen_at`/`last_ip_address`, respond `{ requiresOtp: false, accessToken, refreshToken }`.
   - **Not found:** generate the code, hash it, insert a `login_otp_challenges` row (including the just-obtained `access_token`/`refresh_token` and `expires_at = now() + 120m`), send the OTP email via Brevo, respond `{ requiresOtp: true, challengeId }` — **tokens withheld**.

**`verify-device-otp`**
1. Parse `{ challengeId, code }`.
2. Service-role client fetches the challenge row by id.
   - Missing → 400 `{ error: 'Invalid or expired code' }`.
   - `expires_at` passed → delete row, 400 `{ error: 'Code expired, please sign in again' }`.
   - `attempt_count >= 5` → delete row, 400 `{ error: 'Too many attempts, please sign in again' }`.
   - `sha256(code) !== code_hash` → increment `attempt_count`, 400 `{ error: 'Incorrect code' }`.
   - Match → upsert the trusted device into `user_sessions` (same `(user_id, fingerprint_hash)` unique constraint as 11a), delete the challenge row, respond `{ accessToken, refreshToken }`.

**`resend-device-otp`**
1. Parse `{ challengeId }`.
2. Fetch the row; missing/expired → 400.
3. `now() - last_sent_at < 60s` → 429 `{ error: 'Please wait before requesting another code' }`.
4. Generate a fresh code + `expires_at`, reset `attempt_count = 0`, update `last_sent_at = now()`, resend the Brevo email, respond `{ ok: true }`.

All three share the fingerprinting/hashing helpers already written in 11a's `record-device-session/index.ts` — factor them into a shared `supabase/functions/_shared/device.ts` module rather than duplicating.

Manual setup: deploy all three functions; no new secrets needed beyond the existing `BREVO_API_KEY`/`BREVO_FROM_EMAIL` from 11a (`SUPABASE_SERVICE_ROLE_KEY` is auto-provided by the platform).

---

### Commit 3 — Angular data + service layer

| File | Action |
|------|--------|
| `src/app/core/enums/login-status.enum.ts` | Create |
| `src/app/core/services/data/login-challenge.service.ts` | Create |
| `src/app/core/services/platform/auth.service.ts` | Extend |

**`login-status.enum.ts`**
```ts
export enum LoginStatus {
  Success = 'success',
  OtpRequired = 'otp_required',
}
```

**`login-challenge.service.ts`** — Result-returning wrapper around the three new Edge Functions (`signIn`, `verifyOtp`, `resendOtp`), Zod-validated responses, same shape as `DeviceSessionService`.

**`auth.service.ts` changes:**
- `signInWithEmail()` no longer calls `supabase.auth.signInWithPassword()` directly — delegates to `loginChallengeService.signIn()`.
  - `requiresOtp: false` → `supabase.auth.setSession({ access_token, refresh_token })`, return `ok({ status: LoginStatus.Success })`.
  - `requiresOtp: true` → store `challengeId` in a new `_pendingOtpChallengeId` signal, return `ok({ status: LoginStatus.OtpRequired })` (no error — this is an expected branch, not a failure).
- Add `pendingOtpChallengeId: Signal<string | null>`.
- Add `verifyDeviceOtp(code: string): Promise<Result<void>>` — reads the pending challenge id, calls `loginChallengeService.verifyOtp()`, on success calls `setSession()` and clears the pending signal.
- Add `resendDeviceOtp(): Promise<Result<void>>`.

---

### Commit 4 — Verify Device screen

| File | Action |
|------|--------|
| `src/app/core/enums/auth-route.enum.ts` | Add `VerifyDevice = 'verify-device'` |
| `src/app/core/guards/device-verification-pending.guard.ts` | Create |
| `src/app/features/auth/auth.routes.ts` | Add guarded route |
| `src/app/features/auth/verify-device/verify-device.component.ts` | Create |
| `src/app/features/auth/verify-device/verify-device.component.html` | Create |
| `src/app/features/auth/verify-device/verify-device.component.scss` | Create |
| `src/app/features/auth/verify-device/verify-device.facade.ts` | Create |
| `src/app/features/auth/login/login.facade.ts` | Extend — branch on `LoginStatus` after `signInWithEmail()` |
| `src/assets/i18n/en.json` | Add `AUTH.VERIFY_DEVICE` section |

`VerifyDeviceComponent` mirrors `ResetPasswordComponent`'s structure: one code input, `<app-ui-button [type]="ButtonType.Button">` submit (no `ngSubmit`, per existing rule), loading/error signals from the facade, plus a "Resend code" `<app-ui-button variant="ghost">` disabled during its own 60s client-side cooldown (a simple `WritableSignal<number>` counting down via `setInterval`, cleared on destroy).

`LoginFacade.submitLogin()` branches: `LoginStatus.Success` → navigate to `AppRoute.Progress` (unchanged); `LoginStatus.OtpRequired` → navigate to `[AppRoute.Auth, AuthRoute.VerifyDevice]`.

---

## Out of scope

- Gating Google OAuth sign-in the same way — see Scope Boundary above.
- Gating signup or password-reset session establishment — see Scope Boundary above.
- SMS/authenticator-app (TOTP) OTP — Supabase has native MFA support for that, but it's a different feature (enrollment flow, authenticator app, not email) from what was asked.
- A "manage known devices" UI (list/revoke `user_sessions` rows) — still not requested, still a natural future follow-up, now more relevant since a device removed from that list would need to go through this OTP flow again next sign-in.
- Periodic cleanup of expired/orphaned `login_otp_challenges` rows — correctness doesn't depend on deleting them (expiry is checked on read), but a scheduled cleanup query would be reasonable hygiene later.

---

## Verification

1. `ng build` passes after each commit.
2. Sign in from a known/trusted device (already in `user_sessions` from 11a testing) → confirm normal, immediate login with no OTP prompt.
3. Sign in from a genuinely new browser → confirm login does **not** complete, user lands on Verify Device, and an email with a 6-digit code arrives via Brevo.
4. Enter the correct code → confirm login completes and the device is now trusted (repeat sign-in from the same browser skips OTP).
5. Enter an incorrect code → confirm a clear error and no session is established (check `localStorage`/`supabase.auth.getSession()` in devtools — should be empty).
6. Enter 5 wrong codes → confirm the challenge is invalidated and the user must restart from the login page.
7. Wait past the 120-minute expiry (or manually adjust `expires_at` in the DB for a faster test) → confirm the code is rejected as expired.
8. Click "Resend" → confirm a new code arrives and the previous code no longer works; confirm the 60-second cooldown is enforced both client-side (button disabled) and server-side (rapid repeated calls get a 429).
9. Confirm Google OAuth sign-in still works unchanged and still shows the 11a alert banner (not blocked) when done from a new device.
