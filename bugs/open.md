# Open Bugs

## Password-reset email issues (separate from the Brevo OTP bug, not yet retested)
- Phase 11b (`notify-password-changed` Edge Function) is deployed per the Supabase dashboard, but manually testing the flow (Profile → Change password → reset-link email → set new password) did not produce the alert email in the inbox. Worth retrying now that Brevo's IP-review blocking (see resolved login-OTP bug) has been turned off — may have been the same root cause.
- Supabase magic-link tokens can be invalidated before the user manually clicks them (likely Gmail link-prescanning) — the first reset-link attempt arrived pre-expired (`otp_expired` in the redirect URL). The reset-password page does not surface this error to the user either; it just silently shows the empty form.
- Repro: trigger a fresh password reset, follow the link immediately, submit a new password, watch console (`Failed to send password-changed notification:`) and network tab for the `notify-password-changed` function invoke and the `auth.updateUser` call.

## Brevo OTP emails landing in spam (unauthenticated sending domain)
- The login-device-verification email ("Verify this device to finish signing in") now arrives reliably (Brevo's IP-review blocking was the cause of non-delivery — turned off in the Brevo dashboard, confirmed working 2026-11-13), but it lands in spam/promotions rather than inbox.
- Cause: `BREVO_FROM_EMAIL` isn't on a domain with SPF/DKIM authenticated in Brevo, so receiving providers can't verify the sender. Needs an owned domain added under Brevo's Senders, Domains & Dedicated IPs, with its SPF/DKIM DNS records published, before this can be fixed for real. Mitigated for now with a "check your spam folder" hint on the verify-device screen.

## ui-kit password visibility icon 404s on a subpath deploy
- `@edenoren/ui-kit`'s `UiIconAsset.Visibility` / `VisibilityOff` are hardcoded to `/assets/ui-kit/icons/visibility(-off).svg` inside the compiled library template (`UiInputComponent`'s password toggle button), with no input to override it from the consuming app.
- On a root-hosted deploy this resolves fine; on a subpath deploy (e.g. GitHub Pages' `/progress-v2/`) the leading slash resolves against the domain root instead of `<base href>`, so the icon 404s.
- Cosmetic only — the toggle button still renders and works, just without an icon. Needs a fix in the `ui-kit` repo (relative path or an overridable input) and a republish; can't be patched from this app.

## Local build exceeds the bundle budget (CI build does not — likely benign)
- A clean local `pnpm exec ng build --base-href /progress-v2/` (cache cleared, `pnpm install --frozen-lockfile` re-run) consistently produces a 662.48 kB initial bundle, over the 640 kB RX-8 budget.
- Confirmed this is local-only: the real GitHub Actions run (fully clean container, same lockfile) produced 616.11 kB, under budget — that's what's actually deployed. Not the asset-path fix either (reproduces identically with it stashed out) and not dependency drift (lockfile was already up to date).
- Likely a Windows-vs-Linux esbuild output difference rather than a real regression, but worth a closer look if it starts showing up in CI too.
