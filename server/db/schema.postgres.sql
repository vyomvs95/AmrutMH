-- AMRUT back office - database structure (PostgreSQL version)
-- Mirror of schema.sqlite.sql. Keep the two in step.

CREATE TABLE IF NOT EXISTS divisions (
  id          SERIAL PRIMARY KEY,
  public_id   TEXT NOT NULL UNIQUE,
  name_mr     TEXT NOT NULL,
  name_en     TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS districts (
  id          SERIAL PRIMARY KEY,
  public_id   TEXT NOT NULL UNIQUE,
  division_id INTEGER NOT NULL REFERENCES divisions(id),
  name_mr     TEXT NOT NULL,
  name_en     TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sections (
  id          SERIAL PRIMARY KEY,
  public_id   TEXT NOT NULL UNIQUE,
  slug        TEXT NOT NULL UNIQUE,
  key_en      TEXT NOT NULL,
  name_mr     TEXT NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  public_id     TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  phone         TEXT,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL,
  district_id   INTEGER REFERENCES districts(id),
  division_id   INTEGER REFERENCES divisions(id),
  is_active     SMALLINT NOT NULL DEFAULT 1,
  created_at    TEXT NOT NULL,
  last_login_at TEXT
);

CREATE TABLE IF NOT EXISTS stories (
  id           SERIAL PRIMARY KEY,
  public_id    TEXT NOT NULL UNIQUE,
  title        TEXT NOT NULL,
  body         TEXT NOT NULL DEFAULT '',
  section_id   INTEGER REFERENCES sections(id),
  district_id  INTEGER REFERENCES districts(id),
  author_id    INTEGER REFERENCES users(id),
  status       TEXT NOT NULL DEFAULT 'draft',
  review_note  TEXT,
  reviewed_by  INTEGER REFERENCES users(id),
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL,
  submitted_at TEXT,
  published_at TEXT,
  legacy_id    TEXT
);

CREATE TABLE IF NOT EXISTS story_images (
  id         SERIAL PRIMARY KEY,
  public_id  TEXT NOT NULL UNIQUE,
  story_id   INTEGER NOT NULL REFERENCES stories(id),
  file_path  TEXT NOT NULL,
  caption    TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_log (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER REFERENCES users(id),
  action     TEXT NOT NULL,
  target     TEXT,
  detail     TEXT,
  ip         TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_stories_status   ON stories(status);
CREATE INDEX IF NOT EXISTS idx_stories_district ON stories(district_id);
CREATE INDEX IF NOT EXISTS idx_stories_public   ON stories(public_id);
CREATE INDEX IF NOT EXISTS idx_users_email      ON users(email);
CREATE INDEX IF NOT EXISTS idx_audit_created    ON audit_log(created_at);
