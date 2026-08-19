-- ============================================================================
-- 0002_posts_search_vector.sql
-- Replaces the expression-based full-text search index from 0001_init.sql
-- with a generated column + index on that column.
--
-- supabase-js's .textSearch() helper (and PostgREST generally) filters
-- against a real column, not an arbitrary indexed expression — the original
-- posts_search_idx (a GIN index directly on
-- to_tsvector('english', coalesce(caption,'') || ' ' || coalesce(author_name,'')))
-- can't be targeted from the client without hand-written raw SQL. A stored
-- generated column keeps the same expression (so results are identical) but
-- makes it a normal, queryable column.
-- ============================================================================

drop index if exists posts_search_idx;

alter table posts
  add column search_vector tsvector
  generated always as (
    to_tsvector('english', coalesce(caption, '') || ' ' || coalesce(author_name, ''))
  ) stored;

create index posts_search_idx on posts using gin (search_vector);
