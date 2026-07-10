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
