-- The scrolling band under the navigation: six lines of news or scheme links
-- that run round and round. Only the head office may change them.
CREATE TABLE IF NOT EXISTS ticker_items (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  public_id  TEXT NOT NULL UNIQUE,
  position   INTEGER NOT NULL,
  text_mr    TEXT NOT NULL,
  link_url   TEXT,
  is_active  INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL,
  updated_by INTEGER REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_ticker_position ON ticker_items(position);
