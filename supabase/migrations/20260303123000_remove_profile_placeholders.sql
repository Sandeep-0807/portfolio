-- Remove placeholder defaults for profile content.
-- Keep NOT NULL but default to empty string so the UI can apply safe fallbacks.

ALTER TABLE public.profile_content
  ALTER COLUMN name SET DEFAULT '';

ALTER TABLE public.profile_content
  ALTER COLUMN title SET DEFAULT '';

-- If any rows were created with the old placeholder defaults, clear them.
UPDATE public.profile_content
SET name = ''
WHERE name = 'Your Name';

UPDATE public.profile_content
SET title = ''
WHERE title = 'Your Title';
