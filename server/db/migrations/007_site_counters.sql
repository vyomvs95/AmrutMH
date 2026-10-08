-- Running totals that belong to the whole site rather than to one story.
-- "visits" carries on from the count the existing portal already shows.
CREATE TABLE IF NOT EXISTS site_counters (
  name       TEXT PRIMARY KEY,
  value      BIGINT NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);
