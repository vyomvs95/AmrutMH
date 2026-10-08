-- The cover photograph each archive story carries on the old site, so the
-- dashboard can show a thumbnail beside the headline.
ALTER TABLE legacy_stories ADD COLUMN image_path TEXT;
