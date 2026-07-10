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
