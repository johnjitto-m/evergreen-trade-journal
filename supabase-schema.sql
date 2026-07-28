-- Evergreen Trade Journal — isolated Supabase schema
-- Recommended: create a NEW Supabase project only for Evergreen Trade Journal.
-- If the old and new apps share one project, keep these Evergreen-only table and bucket names.

create extension if not exists pgcrypto;

create table if not exists public.evergreen_trades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  trade_date date not null,
  trade_day text not null,
  pair text not null,
  direction text not null check (direction in ('Long', 'Short')),
  session text not null,
  htf text not null,
  ltf text not null,
  trade_status text not null check (trade_status in ('Took Trade', 'Missed Trade', 'Not Taken')),
  entry_attempt text not null check (entry_attempt in ('1st Entry', '2nd Entry')),
  fvg_status text not null check (fvg_status in ('Fresh FVG', 'Partial FVG')),
  fvg_formed_day text not null check (fvg_formed_day in ('Today', 'Previous Day')),
  result text check (result in ('TP', 'SL', 'BE')),
  sl_pips numeric(10, 2),
  risk_amount numeric(14, 2),
  rr numeric(10, 2),
  pnl numeric(14, 2),
  htf_analysis jsonb not null default '{}'::jsonb,
  ltf_analysis jsonb not null default '{}'::jsonb,
  htf_chart_links jsonb not null default '[]'::jsonb,
  ltf_chart_links jsonb not null default '[]'::jsonb,
  htf_image_path text,
  ltf_image_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Makes this SQL safe to run after the earlier Basic-Info-only schema.
alter table public.evergreen_trades add column if not exists sl_pips numeric(10, 2);
alter table public.evergreen_trades add column if not exists risk_amount numeric(14, 2);
alter table public.evergreen_trades add column if not exists htf_analysis jsonb not null default '{}'::jsonb;
alter table public.evergreen_trades add column if not exists ltf_analysis jsonb not null default '{}'::jsonb;
alter table public.evergreen_trades add column if not exists htf_chart_links jsonb not null default '[]'::jsonb;
alter table public.evergreen_trades add column if not exists ltf_chart_links jsonb not null default '[]'::jsonb;
alter table public.evergreen_trades add column if not exists htf_image_path text;
alter table public.evergreen_trades add column if not exists ltf_image_path text;

-- User-created choices from the “Add Option” buttons.
create table if not exists public.evergreen_journal_options (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null check (category in ('htf_poi_mitigation', 'ltf_entry_level')),
  label text not null check (char_length(label) between 1 and 80),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (user_id, category, label)
);

alter table public.evergreen_trades enable row level security;
alter table public.evergreen_journal_options enable row level security;

drop policy if exists "Evergreen users can read own trades" on public.evergreen_trades;
drop policy if exists "Evergreen users can insert own trades" on public.evergreen_trades;
drop policy if exists "Evergreen users can update own trades" on public.evergreen_trades;
drop policy if exists "Evergreen users can delete own trades" on public.evergreen_trades;

create policy "Evergreen users can read own trades"
on public.evergreen_trades for select
using (auth.uid() = user_id);

create policy "Evergreen users can insert own trades"
on public.evergreen_trades for insert
with check (auth.uid() = user_id);

create policy "Evergreen users can update own trades"
on public.evergreen_trades for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Evergreen users can delete own trades"
on public.evergreen_trades for delete
using (auth.uid() = user_id);

drop policy if exists "Evergreen users can read own options" on public.evergreen_journal_options;
drop policy if exists "Evergreen users can insert own options" on public.evergreen_journal_options;
drop policy if exists "Evergreen users can update own options" on public.evergreen_journal_options;
drop policy if exists "Evergreen users can delete own options" on public.evergreen_journal_options;

create policy "Evergreen users can read own options"
on public.evergreen_journal_options for select
using (auth.uid() = user_id);

create policy "Evergreen users can insert own options"
on public.evergreen_journal_options for insert
with check (auth.uid() = user_id);

create policy "Evergreen users can update own options"
on public.evergreen_journal_options for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Evergreen users can delete own options"
on public.evergreen_journal_options for delete
using (auth.uid() = user_id);

create index if not exists evergreen_trades_user_date_idx
on public.evergreen_trades (user_id, trade_date desc);

create index if not exists evergreen_options_user_category_idx
on public.evergreen_journal_options (user_id, category, is_active);

-- Separate image bucket. Do not reuse the old journal's bucket.
insert into storage.buckets (id, name, public)
values ('evergreen-trade-images', 'evergreen-trade-images', false)
on conflict (id) do nothing;

drop policy if exists "Evergreen users can read own chart images" on storage.objects;
drop policy if exists "Evergreen users can upload own chart images" on storage.objects;
drop policy if exists "Evergreen users can update own chart images" on storage.objects;
drop policy if exists "Evergreen users can delete own chart images" on storage.objects;

-- Store files under: <user-id>/<trade-id>/<filename>
create policy "Evergreen users can read own chart images"
on storage.objects for select
using (
  bucket_id = 'evergreen-trade-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Evergreen users can upload own chart images"
on storage.objects for insert
with check (
  bucket_id = 'evergreen-trade-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Evergreen users can update own chart images"
on storage.objects for update
using (
  bucket_id = 'evergreen-trade-images'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'evergreen-trade-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Evergreen users can delete own chart images"
on storage.objects for delete
using (
  bucket_id = 'evergreen-trade-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);
