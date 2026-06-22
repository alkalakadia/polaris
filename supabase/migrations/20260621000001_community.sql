-- Polaris community: Reddit-style posts, comments, and likes.
--
-- Read is public (anyone, even signed out, can browse the feed). Writes require
-- auth and are owned: you can only create/delete content as yourself. We
-- denormalize author_name onto posts/comments so the feed can show handles
-- without exposing the profiles table (its RLS stays owner-only).

create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------------------
-- posts
-- ---------------------------------------------------------------------------
create table if not exists posts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  author_name text not null default 'bestie',
  sub text not null,
  title text not null,
  body text,
  created_at timestamptz not null default now()
);
create index if not exists idx_posts_sub_created on posts(sub, created_at desc);
create index if not exists idx_posts_created on posts(created_at desc);

alter table posts enable row level security;
create policy "posts: public read" on posts for select using (true);
create policy "posts: owner insert" on posts for insert with check (auth.uid() = user_id);
create policy "posts: owner update" on posts for update using (auth.uid() = user_id);
create policy "posts: owner delete" on posts for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- comments
-- ---------------------------------------------------------------------------
create table if not exists comments (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid not null references posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  author_name text not null default 'bestie',
  body text not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_comments_post on comments(post_id, created_at);

alter table comments enable row level security;
create policy "comments: public read" on comments for select using (true);
create policy "comments: owner insert" on comments for insert with check (auth.uid() = user_id);
create policy "comments: owner delete" on comments for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- post_likes — one row per (post, user); count = hearts.
-- ---------------------------------------------------------------------------
create table if not exists post_likes (
  post_id uuid not null references posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
create index if not exists idx_post_likes_post on post_likes(post_id);

alter table post_likes enable row level security;
create policy "likes: public read" on post_likes for select using (true);
create policy "likes: owner insert" on post_likes for insert with check (auth.uid() = user_id);
create policy "likes: owner delete" on post_likes for delete using (auth.uid() = user_id);
