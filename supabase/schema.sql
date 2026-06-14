-- ============================================================
--  POLLA MUNDIALISTA 2026  –  Schema Supabase
--  Ejecutar en: Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- ── Tablas ──────────────────────────────────────────────────

create table if not exists public.profiles (
  id         uuid  references auth.users(id) on delete cascade primary key,
  name       text  not null,
  is_admin   boolean not null default false,
  created_at timestamptz default now() not null
);
comment on column public.profiles.is_admin is
  'Para hacer admin: UPDATE profiles SET is_admin = true WHERE id = ''<uuid>'';';

create table if not exists public.predictions_group (
  id         bigint generated always as identity primary key,
  user_id    uuid    references auth.users(id) on delete cascade not null,
  match_id   integer not null check (match_id between 1 and 72),
  home_score integer not null check (home_score >= 0),
  away_score integer not null check (away_score >= 0),
  unique (user_id, match_id)
);

create table if not exists public.predictions_ko (
  id          bigint generated always as identity primary key,
  user_id     uuid    references auth.users(id) on delete cascade not null,
  match_id    integer not null check (match_id between 73 and 104),
  winner_code text    not null,
  unique (user_id, match_id)
);

-- Resultados oficiales (solo admin puede escribir)
create table if not exists public.results_group (
  match_id   integer primary key check (match_id between 1 and 72),
  home_score integer not null check (home_score >= 0),
  away_score integer not null check (away_score >= 0),
  updated_at timestamptz default now()
);

create table if not exists public.results_ko (
  match_id    integer primary key check (match_id between 73 and 104),
  winner_code text    not null,
  updated_at  timestamptz default now()
);

-- ── Row Level Security ───────────────────────────────────────

alter table public.profiles          enable row level security;
alter table public.predictions_group enable row level security;
alter table public.predictions_ko    enable row level security;
alter table public.results_group     enable row level security;
alter table public.results_ko        enable row level security;

-- profiles: todos leen, cada usuario escribe el suyo
create policy "profiles_select" on public.profiles
  for select using (true);
create policy "profiles_insert" on public.profiles
  for insert with check (auth.uid() = id);
create policy "profiles_update" on public.profiles
  for update using (auth.uid() = id);

-- predictions_group: todos leen (para el tablero), cada usuario escribe/borra el suyo
create policy "pred_group_select" on public.predictions_group
  for select using (true);
create policy "pred_group_insert" on public.predictions_group
  for insert with check (auth.uid() = user_id);
create policy "pred_group_update" on public.predictions_group
  for update using (auth.uid() = user_id);
create policy "pred_group_delete" on public.predictions_group
  for delete using (auth.uid() = user_id);

-- predictions_ko
create policy "pred_ko_select" on public.predictions_ko
  for select using (true);
create policy "pred_ko_insert" on public.predictions_ko
  for insert with check (auth.uid() = user_id);
create policy "pred_ko_update" on public.predictions_ko
  for update using (auth.uid() = user_id);
create policy "pred_ko_delete" on public.predictions_ko
  for delete using (auth.uid() = user_id);

-- results_group: todos leen, solo admin escribe
create policy "results_group_select" on public.results_group
  for select using (true);
create policy "results_group_write" on public.results_group
  for all using (
    (select is_admin from public.profiles where id = auth.uid())
  );

-- results_ko
create policy "results_ko_select" on public.results_ko
  for select using (true);
create policy "results_ko_write" on public.results_ko
  for all using (
    (select is_admin from public.profiles where id = auth.uid())
  );

-- ── Real-time ────────────────────────────────────────────────

alter publication supabase_realtime add table public.profiles;
alter publication supabase_realtime add table public.predictions_group;
alter publication supabase_realtime add table public.predictions_ko;
alter publication supabase_realtime add table public.results_group;
alter publication supabase_realtime add table public.results_ko;

-- ── Para hacer admin al primer usuario ──────────────────────
-- Después de que el organizador se registre, ejecutar:
--   UPDATE public.profiles SET is_admin = true WHERE name = 'TuNombre';
