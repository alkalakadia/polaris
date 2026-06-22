-- Enforce the 1-hour edit window for posts at the database level.
-- (Delete is already owner-only via the existing policies; this only tightens UPDATE.)

drop policy if exists "posts: owner update" on posts;
create policy "posts: owner update" on posts
  for update using (auth.uid() = user_id and created_at > now() - interval '1 hour');
