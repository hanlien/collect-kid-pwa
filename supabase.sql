-- Enable UUID generation
create extension if not exists pgcrypto;

-- Users table
create table if not exists users(
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default now(),
  last_seen timestamp with time zone default now(),
  kid_mode boolean default true,
  streak_days int default 0,
  coins integer default 0 not null,
  level integer default 1 not null,
  total_captures integer default 0 not null,
  unique_species_count integer default 0 not null
);

-- Captures table for storing identification results
create table if not exists captures(
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  created_at timestamp with time zone default now(),
  category text check (category in ('animal','bug','flower')),
  provider text check (provider in ('gcv','plantid','local')),
  canonical_name text,
  common_name text,
  rank text,
  confidence float,
  gbif_key int,
  thumb_url text,
  location_hint text,
  summary text,
  fun_facts text[],
  color_chips text[],
  coins_earned integer default 0 not null,
  is_new_species boolean default false not null
);

-- Badges table for gamification
create table if not exists badges(
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  category text not null,
  subtype text not null,
  level int default 1,
  count int default 0,
  next_goal integer not null,
  unique(user_id, category, subtype)
);

-- Achievements table for coin rewards
create table if not exists achievements(
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  created_at timestamp with time zone default now(),
  type text not null,
  title text not null,
  description text not null,
  coins_rewarded integer default 0 not null,
  icon text,
  unique(user_id, type)
);

-- Indexes for performance
create index if not exists idx_captures_user_id on captures(user_id);
create index if not exists idx_captures_category on captures(category);
create index if not exists idx_badges_user_id on badges(user_id);
create index if not exists idx_badges_category on badges(category);
create index if not exists idx_achievements_user_id on achievements(user_id);
