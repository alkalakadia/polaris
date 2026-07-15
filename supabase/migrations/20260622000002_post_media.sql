-- Photos/videos on community posts.

alter table posts add column if not exists media jsonb not null default '[]'::jsonb;

-- Public storage bucket for post media (anyone can view; signed-in users upload).
insert into storage.buckets (id, name, public)
values ('post-media', 'post-media', true)
on conflict (id) do nothing;

do $$ begin
  create policy "post-media public read" on storage.objects
    for select using (bucket_id = 'post-media');
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "post-media auth upload" on storage.objects
    for insert with check (bucket_id = 'post-media' and auth.role() = 'authenticated');
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "post-media owner delete" on storage.objects
    for delete using (bucket_id = 'post-media' and owner = auth.uid());
exception when duplicate_object then null; end $$;
