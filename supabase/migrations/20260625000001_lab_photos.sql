-- Private storage for lab-report photos. Owner-only: each user can only read,
-- upload, and delete files inside their own /{user_id}/ folder.

insert into storage.buckets (id, name, public)
values ('lab-photos', 'lab-photos', false)
on conflict (id) do nothing;

do $$ begin
  create policy "lab-photos owner read" on storage.objects
    for select using (
      bucket_id = 'lab-photos' and auth.uid()::text = (storage.foldername(name))[1]
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "lab-photos owner insert" on storage.objects
    for insert with check (
      bucket_id = 'lab-photos' and auth.uid()::text = (storage.foldername(name))[1]
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "lab-photos owner delete" on storage.objects
    for delete using (
      bucket_id = 'lab-photos' and auth.uid()::text = (storage.foldername(name))[1]
    );
exception when duplicate_object then null; end $$;
