-- LoL Champion Journey snapshots
-- Apply only to the shared gamer Supabase project (ZeroTwo), never pizzaria-db.

create table if not exists public.lol_champion_journey_snapshots (
  id uuid primary key default gen_random_uuid(),
  profile_key text not null,
  game_name text not null,
  tag_line text not null,
  platform text not null,
  captured_at timestamptz not null default now(),
  sample_matches integer not null default 0 check (sample_matches >= 0),
  signature text,
  champions jsonb not null default '[]'::jsonb,
  source_version text,
  created_at timestamptz not null default now()
);

create index if not exists lol_cj_snapshots_profile_captured_idx
  on public.lol_champion_journey_snapshots (profile_key, captured_at desc);

create unique index if not exists lol_cj_snapshots_dedupe_idx
  on public.lol_champion_journey_snapshots
  (profile_key, captured_at);

alter table public.lol_champion_journey_snapshots enable row level security;

-- Snapshots are server-authoritative. Browser roles must not write/read this table
-- directly; access should go through trusted gamer Edge Functions.
revoke all on table public.lol_champion_journey_snapshots from anon, authenticated;
