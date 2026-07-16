-- Paradise Lost research telemetry: run once in the Supabase SQL Editor.
-- The browser has no direct table access. It may only call the Edge Function.
create table if not exists public.game_sessions (
  id uuid primary key default gen_random_uuid(),
  session_id text not null unique check (char_length(session_id) between 12 and 80),
  hero_name text not null check (char_length(hero_name) between 1 and 24),
  score integer not null check (score >= 0 and score <= 10000000),
  chapters_completed smallint not null check (chapters_completed between 0 and 12),
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.game_sessions enable row level security;
revoke all on table public.game_sessions from anon, authenticated;

-- No public SELECT/INSERT/UPDATE policies: service-role access is restricted to
-- the Edge Function environment and bypasses RLS.
