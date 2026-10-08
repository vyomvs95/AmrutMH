-- Remember how big each photograph is, so a page can hold its space while
-- the image loads instead of jumping about.
ALTER TABLE story_images ADD COLUMN img_w INTEGER;
ALTER TABLE story_images ADD COLUMN img_h INTEGER;
