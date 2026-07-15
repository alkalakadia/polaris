-- Community safety: private post media + reports.

-- 1) Make community photo/video bucket PRIVATE (no permanent public URLs).
--    Images are still viewable in-app via short-lived signed URLs (the existing
--    select policy lets the app mint them); they're just no longer hotlinkable
--    forever, and the bucket isn't publicly listable.
update storage.buckets set public = false where id = 'post-media';

-- 2) Reports: let signed-in users flag a post or comment. Only staff (service
--    role) can read them; regular users can only insert their own.
create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references auth.users(id) on delete set null,
  post_id uuid references posts(id) on delete cascade,
  comment_id uuid references comments(id) on delete cascade,
  reason text,
  created_at timestamptz not null default now()
);

alter table reports enable row level security;

do $$ begin
  create policy "reports insert own" on reports
    for insert with check (auth.uid() = reporter_id);
exception when duplicate_object then null; end $$;
