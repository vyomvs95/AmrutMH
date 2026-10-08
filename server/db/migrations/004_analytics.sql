-- Counting what is read, and what advertisements are seen.
--
-- Two numbers are kept for everything, because they answer different questions:
--   views   - every read, the same person counted again on a later visit.
--             This is what an advertiser is buying.
--   uniques - how many different people. This is what AMRUT should plan with.
--
-- Nobody's address is stored. A visitor is reduced to a hash that is re-salted
-- every day, so the same person cannot be followed from one day to the next.

CREATE TABLE IF NOT EXISTS view_daily (
  subject      TEXT NOT NULL,          -- a story's public id, or an archive story's number
  subject_kind TEXT NOT NULL,          -- story | ad
  day          TEXT NOT NULL,          -- YYYY-MM-DD
  views        INTEGER NOT NULL DEFAULT 0,
  uniques      INTEGER NOT NULL DEFAULT 0,
  clicks       INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (subject, subject_kind, day)
);

CREATE TABLE IF NOT EXISTS view_seen (
  subject      TEXT NOT NULL,
  subject_kind TEXT NOT NULL,
  day          TEXT NOT NULL,
  visitor      TEXT NOT NULL,
  PRIMARY KEY (subject, subject_kind, day, visitor)
);

-- Titles for the 3,035 stories that came across from the old site, so a
-- dashboard can name them instead of showing a bare number.
CREATE TABLE IF NOT EXISTS legacy_stories (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  cat         TEXT,
  district_en TEXT
);

CREATE INDEX IF NOT EXISTS idx_view_daily_day  ON view_daily(day);
CREATE INDEX IF NOT EXISTS idx_view_daily_kind ON view_daily(subject_kind, day);
CREATE INDEX IF NOT EXISTS idx_view_seen_day   ON view_seen(day);
