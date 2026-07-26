create table feedback (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  user_id uuid references auth.users(id) on delete set null,
  overall_rating int check (overall_rating between 1 and 5),
  most_useful text,
  missing_features text,
  biggest_frustration text,
  would_recommend boolean,
  open_feedback text,
  current_version text
);

alter table feedback enable row level security;
create policy "Users can insert their own feedback"
  on feedback for insert
  with check (auth.uid() = user_id or user_id is null);
