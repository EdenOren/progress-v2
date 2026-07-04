# Phase 2b — Auth Extensions (Forgot / Reset Password)

**Branch:** `feature/23-auth-password-reset`
**Target:** `development`

---

## Context

Priority order after Settings (done, PR #22) is Phase 2b (this) then Phase 11 (Security). There's currently no way for a user who forgets their password to regain access — Login only supports email/password and Google OAuth. This phase adds the standard Supabase forgot/reset password flow: a "Forgot password?" link on Login sends a reset email; clicking it lands on a Reset Password page where the user sets a new password.

This closely mirrors the existing Login/Signup pattern (facade + Signal Form + translated copy), confirmed via direct reads of `login.component.ts/.facade.ts/.html`, `signup.component.ts` (for the password-confirmation-match pattern), `auth.service.ts`, `auth-callback.component.ts`, `guest.guard.ts`, and `auth.routes.ts`.

---

## Key design decision: the callback/guard interaction

Supabase's password-recovery email link redirects back to the app with tokens in the URL fragment, which the Supabase JS client auto-parses into a **real session** (`isAuthenticated() === true`) — that's how `supabase.auth.updateUser({ password })` is authorized without asking for the old password.

This creates two traps if built naively:

1. **Don't route the recovery link through `/auth/callback`.** `auth-callback.component.ts` unconditionally navigates to `AppRoute.Progress` the instant `isAuthenticated()` becomes true (`effect(() => { if (this.authService.isAuthenticated()) { void this.router.navigate([AppRoute.Progress]); } })`). That would skip the password-reset step entirely. Fix: point `resetPasswordForEmail`'s `redirectTo` straight at `/auth/reset-password`, not `/auth/callback`.
2. **Don't guard `/auth/reset-password` with `guestGuard`.** `guest.guard.ts` redirects to Progress whenever `isAuthenticated()` is true — but arriving on this page via a valid recovery link means `isAuthenticated()` is (correctly) true. Applying `guestGuard` here would bounce the user straight past the reset form. `ForgotPasswordComponent`'s route keeps `guestGuard` (same treatment as Login/Signup); `ResetPasswordComponent`'s route gets **no guard**.

To detect an invalid/expired link (no session established), `ResetPasswordComponent` waits on `authService.initialized` (the same promise `guestGuard` awaits — it resolves after Supabase's client-init step, which includes URL-fragment session detection) then checks `isAuthenticated()`: true → show the form, false → show an "invalid/expired link" message with a link back to Forgot Password.

---

## Files to Create / Modify

### Commit 1 — Service + routing

| File | Action |
|------|--------|
| `src/app/core/services/platform/auth.service.ts` | Add `resetPasswordForEmail()` + `updateUserPassword()` |
| `src/app/core/enums/auth-route.enum.ts` | Add `ForgotPassword = 'forgot-password'`, `ResetPassword = 'reset-password'` |
| `src/app/features/auth/auth.routes.ts` | Add both routes |
| `src/assets/i18n/en.json` | Add `AUTH.FORGOT_PASSWORD` + `AUTH.RESET_PASSWORD` sections |

**`auth.service.ts` additions** (same `Result<T>`/`mapSupabaseAuthError` pattern as every existing method):
```ts
async resetPasswordForEmail(email: string): Promise<Result<void>> {
  const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${this.document.location.origin}/${AppRoute.Auth}/${AuthRoute.ResetPassword}`,
  });
  if (error) {
    return err(mapSupabaseAuthError(error.message));
  }
  return ok(undefined);
}

async updateUserPassword(password: string): Promise<Result<void>> {
  const { error } = await this.supabase.auth.updateUser({ password });
  if (error) {
    return err(mapSupabaseAuthError(error.message));
  }
  return ok(undefined);
}
```

**`auth.routes.ts` additions:**
```ts
{
  path: AuthRoute.ForgotPassword,
  canActivate: [guestGuard],
  loadComponent: () =>
    import('./forgot-password/forgot-password.component').then((m) => m.ForgotPasswordComponent),
},
{
  path: AuthRoute.ResetPassword,
  loadComponent: () =>
    import('./reset-password/reset-password.component').then((m) => m.ResetPasswordComponent),
},
```
(`ResetPassword` intentionally has no `canActivate` — see design decision above.)

**`en.json` additions:**
```json
"FORGOT_PASSWORD": {
  "TITLE": "Forgot your password?",
  "SUBTITLE": "Enter your email and we'll send you a reset link",
  "EMAIL_LABEL": "Email address",
  "EMAIL_PLACEHOLDER": "you@example.com",
  "SUBMIT_BUTTON": "Send reset link",
  "LOADING": "Sending…",
  "SUCCESS": "Check your email for a reset link.",
  "BACK_TO_LOGIN": "Back to sign in"
},
"RESET_PASSWORD": {
  "TITLE": "Reset your password",
  "SUBTITLE": "Enter your new password",
  "PASSWORD_LABEL": "New password",
  "PASSWORD_PLACEHOLDER": "Min. 8 characters",
  "CONFIRM_PASSWORD_LABEL": "Confirm password",
  "CONFIRM_PASSWORD_PLACEHOLDER": "Re-enter password",
  "SUBMIT_BUTTON": "Update password",
  "LOADING": "Updating…",
  "INVALID_LINK": "This reset link has expired or is invalid.",
  "REQUEST_NEW_LINK": "Request a new link"
}
```
Also add `"FORGOT_PASSWORD_LINK": "Forgot password?"` to `AUTH.LOGIN` for the new link on the Login page.

---

### Commit 2 — Forgot Password page

| File | Action |
|------|--------|
| `src/app/features/auth/forgot-password/forgot-password.facade.ts` | Create |
| `src/app/features/auth/forgot-password/forgot-password.component.ts` | Create |
| `src/app/features/auth/forgot-password/forgot-password.component.html` | Create |
| `src/app/features/auth/forgot-password/forgot-password.component.scss` | Create |
| `src/app/features/auth/login/login.component.ts` / `.html` | Add "Forgot password?" link |

**`ForgotPasswordFacade`** — mirrors `LoginFacade` shape: `isLoading`/`errorMessage` signals, plus a `submitSuccess: WritableSignal<boolean>` (like Signup's `needsVerification`) since success here means "email sent", not navigation:
```ts
async submitForgotPassword(email: string): Promise<void> {
  this._isLoading.set(true);
  this._errorMessage.set('');
  const result = await this.authService.resetPasswordForEmail(email);
  this._isLoading.set(false);
  if (!result.success) {
    this._errorMessage.set(result.error.message);
    return;
  }
  this._submitSuccess.set(true);
}
```

**`ForgotPasswordComponent`** — single `email` field (`required` + `email` validators, exact same pattern as `LoginComponent`'s email field). Template: `@if (facade.submitSuccess()) { success message + link back to Login } @else { form }`, matching Signup's `needsVerification` branch structure.

**Login page change:** one `<app-ui-link [label]="t['FORGOT_PASSWORD_LINK']" [route]="['../', authRoute.ForgotPassword]" />` added near the password field/footer.

---

### Commit 3 — Reset Password page

| File | Action |
|------|--------|
| `src/app/features/auth/reset-password/reset-password.facade.ts` | Create |
| `src/app/features/auth/reset-password/reset-password.component.ts` | Create |
| `src/app/features/auth/reset-password/reset-password.component.html` | Create |
| `src/app/features/auth/reset-password/reset-password.component.scss` | Create |

**`ResetPasswordFacade`** — adds a `ready: Signal<boolean>` gate on top of the Login/Signup shape:
```ts
private readonly _ready: WritableSignal<boolean> = signal(false);
readonly ready: Signal<boolean> = this._ready;
readonly canReset: Signal<boolean> = computed(() => this.authService.isAuthenticated());

constructor() {
  void this.authService.initialized.then(() => this._ready.set(true));
}

async submitReset(password: string): Promise<void> {
  this._isLoading.set(true);
  this._errorMessage.set('');
  const result = await this.authService.updateUserPassword(password);
  this._isLoading.set(false);
  if (!result.success) {
    this._errorMessage.set(result.error.message);
    return;
  }
  await this.router.navigate([AppRoute.Progress]);
}
```

**`ResetPasswordComponent`** — `password` + `confirmPassword` fields, **exact copy of `SignupComponent`'s `_passwordsMismatch` pattern** (required + minLength(8) on password, required on confirmPassword, manual mismatch check in `submit()` before calling the facade). Template:
```
@if (!facade.ready()) {
  <!-- loading spinner, matches auth-callback's spinner markup -->
} @else if (!facade.canReset()) {
  <!-- INVALID_LINK message + ui-link back to ForgotPassword -->
} @else {
  <!-- the actual form -->
}
```

---

## Out of scope

- Rate-limiting / resend-cooldown UI on Forgot Password (Supabase applies its own server-side rate limit; surfacing a countdown is a future nicety, not required for the flow to work).
- Changing password from within the app while already logged in (Settings/Profile) — this phase is specifically the *forgot* password (logged-out) flow.
- Phase 11 (Security) — separate next phase, not started here.

---

## Verification

1. `ng build` passes after each commit.
2. Manual: Login page shows "Forgot password?" link → navigates to `/auth/forgot-password`.
3. Submit a real email on Forgot Password → success message shown (no navigation).
4. Click the emailed reset link → lands on `/auth/reset-password` with the form visible (not bounced to Progress, not shown "invalid link").
5. Submit a new password with a mismatched confirm value → inline validation error, no request sent.
6. Submit matching passwords → navigates to Progress; logging out and back in with the new password succeeds.
7. Visit `/auth/reset-password` directly with no valid recovery session → "invalid/expired link" message shown, with a link back to Forgot Password.
