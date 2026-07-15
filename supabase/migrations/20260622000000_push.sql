-- Web-push subscriptions for free daily reminders.
-- Only the server (secret key) reads/writes this table, so RLS is enabled with
-- no anon policies (clients go through /api/push/subscribe).

create table if not exists push_subscriptions (
  endpoint text primary key,
  p256dh text not null,
  auth text not null,
  hour int not null default 19,
  user_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table push_subscriptions enable row level security;
