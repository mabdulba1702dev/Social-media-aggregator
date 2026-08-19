-- ============================================================================
-- 0001_init.sql
-- Initial schema for the social post bookmarking/embed app.
-- See docs/database-schema.md for the annotated explanation of every table.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- profiles
-- One row per authenticated user, extends auth.users (managed by Supabase Auth).
-- ----------------------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- Auto-create a profile row whenever a new auth user signs up (Google SSO).
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ----------------------------------------------------------------------------
-- boards
-- The core organizing unit ("collection" in the PRD). Personal or shared.
-- One level of nesting via parent_board_id (a "folder" board containing
-- sub-boards) — see PRD §14 assumption #3.
-- ----------------------------------------------------------------------------
create table boards (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles (id) on delete cascade,
  parent_board_id uuid references boards (id) on delete set null,
  name text not null,
  slug text not null unique,
  description text,
  visibility text not null default 'private'
    check (visibility in ('private', 'shared_link', 'public')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enforce max one level of nesting: a board with a parent cannot itself be a parent.
create function public.enforce_single_level_nesting()
returns trigger
language plpgsql
as $$
begin
  if new.parent_board_id is not null then
    if exists (
      select 1 from boards where id = new.parent_board_id and parent_board_id is not null
    ) then
      raise exception 'Boards may only be nested one level deep';
    end if;
  end if;
  return new;
end;
$$;

create trigger boards_single_level_nesting
  before insert or update on boards
  for each row execute procedure public.enforce_single_level_nesting();

create index boards_owner_idx on boards (owner_id);
create index boards_parent_idx on boards (parent_board_id);

-- ----------------------------------------------------------------------------
-- board_members
-- Roles: owner (implicit via boards.owner_id, also mirrored here for uniform
-- permission checks), collaborator (can add/remove posts), viewer (read-only,
-- only relevant for invite-based private sharing, not link-based sharing).
-- ----------------------------------------------------------------------------
create table board_members (
  board_id uuid not null references boards (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  role text not null check (role in ('owner', 'collaborator', 'viewer')),
  invited_at timestamptz not null default now(),
  accepted_at timestamptz,
  primary key (board_id, user_id)
);

create index board_members_user_idx on board_members (user_id);

-- ----------------------------------------------------------------------------
-- sources
-- A connected ingestion channel (Telegram/Discord/WhatsApp group) mapped to
-- exactly one board. A board can have multiple sources (PRD §6.4).
-- ----------------------------------------------------------------------------
create table sources (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references boards (id) on delete cascade,
  platform text not null check (platform in ('telegram', 'discord', 'whatsapp')),
  external_group_id text not null,
  display_name text,
  status text not null default 'active' check (status in ('active', 'paused', 'error')),
  connected_by uuid references profiles (id) on delete set null,
  connected_at timestamptz not null default now(),
  last_event_at timestamptz,
  unique (platform, external_group_id)
);

create index sources_board_idx on sources (board_id);

-- ----------------------------------------------------------------------------
-- posts
-- One saved URL. url_hash is the normalized/deduped key (see docs) —
-- unique per board so the same link can't be saved twice into one board,
-- but *can* appear in multiple different boards.
-- ----------------------------------------------------------------------------
create table posts (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references boards (id) on delete cascade,
  canonical_url text not null,
  url_hash text not null,
  platform text not null check (
    platform in (
      'instagram', 'x', 'tiktok', 'youtube', 'facebook',
      'reddit', 'threads', 'pinterest', 'linkedin', 'bluesky', 'other'
    )
  ),
  embed_html text,
  embed_thumbnail_url text,
  caption text,
  author_name text,
  author_handle text,
  source_type text not null default 'manual' check (source_type in ('manual', 'telegram', 'discord', 'whatsapp')),
  source_id uuid references sources (id) on delete set null,
  added_by uuid references profiles (id) on delete set null,
  status text not null default 'active' check (status in ('active', 'unavailable', 'removed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (board_id, url_hash)
);

create index posts_board_idx on posts (board_id);
create index posts_platform_idx on posts (platform);
create index posts_created_idx on posts (created_at desc);
-- Full-text search across caption + author (PRD §6.6).
create index posts_search_idx on posts using gin (
  to_tsvector('english', coalesce(caption, '') || ' ' || coalesce(author_name, ''))
);

-- ----------------------------------------------------------------------------
-- tags
-- Scoped per board (not global) — keeps tag lists relevant to each board's
-- own content instead of one giant shared namespace.
-- ----------------------------------------------------------------------------
create table tags (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references boards (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (board_id, name)
);

create table post_tags (
  post_id uuid not null references posts (id) on delete cascade,
  tag_id uuid not null references tags (id) on delete cascade,
  primary key (post_id, tag_id)
);

-- ----------------------------------------------------------------------------
-- ingestion_events
-- One row per inbound bot message, keyed by (source, raw_message_id) so a
-- redelivered webhook or a worker retry can never create a duplicate post.
-- This is the idempotency mechanism referenced in PRD §9.3.
-- ----------------------------------------------------------------------------
create table ingestion_events (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references sources (id) on delete cascade,
  raw_message_id text not null,
  status text not null default 'pending' check (status in ('pending', 'processed', 'duplicate', 'ignored', 'failed')),
  post_id uuid references posts (id) on delete set null,
  error text,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  unique (source_id, raw_message_id)
);

create index ingestion_events_source_idx on ingestion_events (source_id);
create index ingestion_events_status_idx on ingestion_events (status);

-- ----------------------------------------------------------------------------
-- blocklist_rules
-- Lightweight moderation net for fully-automatic ingestion (PRD §6.9).
-- ----------------------------------------------------------------------------
create table blocklist_rules (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references boards (id) on delete cascade,
  rule_type text not null check (rule_type in ('domain', 'keyword')),
  value text not null,
  created_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index blocklist_rules_board_idx on blocklist_rules (board_id);

-- ============================================================================
-- Row Level Security
-- ============================================================================

alter table profiles enable row level security;
alter table boards enable row level security;
alter table board_members enable row level security;
alter table sources enable row level security;
alter table posts enable row level security;
alter table tags enable row level security;
alter table post_tags enable row level security;
alter table ingestion_events enable row level security;
alter table blocklist_rules enable row level security;

-- profiles: readable by anyone (needed to show author/collaborator names on
-- shared boards), writable only by the profile's own owner.
create policy "profiles are publicly readable" on profiles
  for select using (true);
create policy "users update own profile" on profiles
  for update using (auth.uid() = id);

-- Helper: is the current user a member (any role) of a board?
create function public.is_board_member(target_board_id uuid)
returns boolean
language sql security definer stable
as $$
  select exists (
    select 1 from board_members
    where board_id = target_board_id and user_id = auth.uid()
  );
$$;

-- Helper: does the current user have collaborator/owner rights on a board?
create function public.can_edit_board(target_board_id uuid)
returns boolean
language sql security definer stable
as $$
  select exists (
    select 1 from board_members
    where board_id = target_board_id
      and user_id = auth.uid()
      and role in ('owner', 'collaborator')
  );
$$;

-- boards: visible if public, shared_link, or the user is a member; editable
-- only by members with owner/collaborator role.
create policy "boards visible to members or public/shared" on boards
  for select using (
    visibility in ('public', 'shared_link')
    or owner_id = auth.uid()
    or public.is_board_member(id)
  );
create policy "boards insertable by authenticated users" on boards
  for insert with check (owner_id = auth.uid());
create policy "boards editable by owner/collaborator" on boards
  for update using (owner_id = auth.uid() or public.can_edit_board(id));
create policy "boards deletable by owner" on boards
  for delete using (owner_id = auth.uid());

-- board_members: members can see the roster; only the board owner manages it.
create policy "members visible to board members" on board_members
  for select using (public.is_board_member(board_id) or exists (
    select 1 from boards where id = board_id and owner_id = auth.uid()
  ));
create policy "members manageable by board owner" on board_members
  for all using (exists (
    select 1 from boards where id = board_id and owner_id = auth.uid()
  ));

-- posts: visible under the same rule as their board; insertable/updatable by
-- collaborators+ (this also covers ingestion workers, which act via the
-- service role key and bypass RLS entirely — see docs/database-schema.md).
create policy "posts visible with board" on posts
  for select using (
    exists (
      select 1 from boards b
      where b.id = board_id
        and (b.visibility in ('public', 'shared_link') or b.owner_id = auth.uid() or public.is_board_member(b.id))
    )
  );
create policy "posts insertable by board collaborators" on posts
  for insert with check (public.can_edit_board(board_id));
create policy "posts editable by board collaborators" on posts
  for update using (public.can_edit_board(board_id));
create policy "posts deletable by board collaborators" on posts
  for delete using (public.can_edit_board(board_id));

-- tags / post_tags: same collaborator model as posts.
create policy "tags visible with board" on tags
  for select using (
    exists (select 1 from boards b where b.id = board_id and
      (b.visibility in ('public', 'shared_link') or b.owner_id = auth.uid() or public.is_board_member(b.id)))
  );
create policy "tags manageable by collaborators" on tags
  for all using (public.can_edit_board(board_id));

create policy "post_tags follow post visibility" on post_tags
  for select using (
    exists (select 1 from posts p where p.id = post_id)
  );
create policy "post_tags manageable by collaborators" on post_tags
  for all using (
    exists (
      select 1 from posts p where p.id = post_id and public.can_edit_board(p.board_id)
    )
  );

-- sources / ingestion_events / blocklist_rules: owner/collaborator only —
-- these are configuration, not content, so viewers shouldn't see bot tokens
-- or raw ingestion logs.
create policy "sources manageable by collaborators" on sources
  for all using (public.can_edit_board(board_id));

create policy "ingestion_events visible to collaborators" on ingestion_events
  for select using (
    exists (select 1 from sources s where s.id = source_id and public.can_edit_board(s.board_id))
  );

create policy "blocklist manageable by collaborators" on blocklist_rules
  for all using (public.can_edit_board(board_id));
