# Phase 11b — Security: Account-Change Email Notifications

## Scope

Original backlog wording was "password reset, email change." The app has no email-change
feature (Profile only edits display name / DOB / height; Settings only edits units) — so
there is nothing to hook for that case. Scope narrows to:

- **Password changed** → send a Brevo alert email, reusing the account's password-reset flow
  (`ResetPasswordComponent` → `AuthService.updateUserPassword()`).

If an email-change feature is ever added, its notification can reuse the same shared pieces
built here.

## Trigger point

`AuthService.updateUserPassword()` (`src/app/core/services/platform/auth.service.ts:156`) is
the single call site for password changes today (used only by `ResetPasswordFacade.submitReset()`).
After `supabase.auth.updateUser({ password })` succeeds, fire a notification call — same
fire-and-forget pattern as `recordDeviceSession()` (log to console on failure, never block or
fail the password-change flow itself).

## Backend — new Edge Function `notify-password-changed`

- Same auth pattern as `record-device-session`: requires `Authorization` header, verifies the
  caller via an anon-key client's `auth.getUser()`, reads `userAgent`/`ipAddress` via
  `_shared/device.ts`.
- No table read/write — this function is stateless, just sends an email.
- Sends a Brevo email: "Your password was changed", with time/device/IP shown (same
  info as the new-device alert, so the user can tell if the change wasn't them).
- Returns `{ ok: true }`.

## Shared template extraction

`record-device-session/index.ts` currently has its alert HTML inline
(`buildAlertEmailHtml`). Since `notify-password-changed` needs a near-identical layout
(heading, message, time/device/IP box, warning callout), extract a shared builder into
`_shared/email-templates.ts`:

```ts
buildSecurityAlertEmailHtml({ heading, message, userAgent, ipAddress, timestamp, warningText }): string
```

Refactor `record-device-session` to call it (no behavior change) and have
`notify-password-changed` call it with its own heading/message/warning copy.

## Frontend

- New `src/app/core/services/data/account-notifications.service.ts` —
  `AccountNotificationsService.notifyPasswordChanged(): Promise<Result<void>>`, invokes the new
  function via `supabase.functions.invoke('notify-password-changed')`, same
  `Result`/error-mapping shape as `DeviceSessionService`.
- `AuthService.updateUserPassword()` — after the Supabase call succeeds, call
  `this.accountNotificationsService.notifyPasswordChanged()` fire-and-forget (`.then()`,
  log on failure), then return `ok(undefined)` immediately — the email send must not add
  latency to the password-change UX.

## Not in scope

- No new migration (no new tables/columns).
- No new i18n strings (silent background notification, no UI change).
- No change to the forgot-password *request* email (that's Supabase's own built-in recovery
  email, untouched).

## Manual deploy steps (outside repo, after merge)

- Deploy `notify-password-changed`.
- Redeploy `record-device-session` (now imports `_shared/email-templates.ts`).
- No new secrets — reuses existing `BREVO_API_KEY` / `BREVO_FROM_EMAIL`.
