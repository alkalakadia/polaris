-- Polaris patient app: per-user tracker + lightweight profiles, with RLS.
--
-- This is the cloud layer for the consumer pivot. Every signed-in user owns
-- their own tracker rows; Row Level Security makes a user's data invisible to
-- everyone else. The browser uses the anon key + the user's auth JWT, so RLS
-- (not the service role) is the security boundary here.

create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------------------
-- profiles — one row per auth user. display_name powers community identity.
-- ---------------------------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "profiles: owner can read" on profiles
  for select using (auth.uid() = id);
create policy "profiles: owner can insert" on profiles
  for insert with check (auth.uid() = id);
create policy "profiles: owner can update" on profiles
  for update using (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- tracker_entries — one row per user per day. `data` holds the TrackEntry
-- shape (see lib/tracker.ts). Upserted on (user_id, entry_date).
-- ---------------------------------------------------------------------------
create table if not exists tracker_entries (
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_date date not null,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, entry_date)
);

create index if not exists idx_tracker_entries_user on tracker_entries(user_id, entry_date desc);

alter table tracker_entries enable row level security;

create policy "tracker: owner can read" on tracker_entries
  for select using (auth.uid() = user_id);
create policy "tracker: owner can insert" on tracker_entries
  for insert with check (auth.uid() = user_id);
create policy "tracker: owner can update" on tracker_entries
  for update using (auth.uid() = user_id);
create policy "tracker: owner can delete" on tracker_entries
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Auto-create a profile row whenever a new auth user signs up.
-- ---------------------------------------------------------------------------
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, nullif(new.raw_user_meta_data->>'display_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
