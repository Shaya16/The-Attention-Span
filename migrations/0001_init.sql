-- Per-post denormalized counters for fast reads on the homepage.
CREATE TABLE IF NOT EXISTS post_stats (
  slug          TEXT PRIMARY KEY,
  clap_total    INTEGER NOT NULL DEFAULT 0,
  comment_count INTEGER NOT NULL DEFAULT 0,
  updated_at    INTEGER NOT NULL
);

-- One row per (post, visitor). count is capped at the per-visitor max in app code.
CREATE TABLE IF NOT EXISTS claps (
  slug       TEXT NOT NULL,
  visitor_id TEXT NOT NULL,
  count      INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (slug, visitor_id)
);

CREATE TABLE IF NOT EXISTS comments (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  slug       TEXT NOT NULL,
  author     TEXT NOT NULL,
  body       TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  status     TEXT NOT NULL DEFAULT 'pending'
             CHECK (status IN ('pending', 'approved', 'rejected'))
);

CREATE INDEX IF NOT EXISTS comments_by_post
  ON comments(slug, status, created_at);

CREATE INDEX IF NOT EXISTS comments_pending
  ON comments(status, created_at);
