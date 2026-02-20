-- One-off migration: Update properties.owner_id from a Clerk ID to a Supabase UUID
-- IMPORTANT: Run this in Supabase SQL Editor after taking a backup.

BEGIN;

-- Diagnostics (before)
SELECT 'properties_before' AS what, COUNT(*) FROM public.properties WHERE owner_id = 'user_35wA9egXXsSfcza1TUROhHcVl8q';

-- Update statement
UPDATE public.properties
SET owner_id = 'dd2e7137-b972-47a6-b5b5-e4903eb0ecc3'
WHERE owner_id = 'user_35wA9egXXsSfcza1TUROhHcVl8q';

-- Diagnostics (after)
SELECT 'properties_after_old' AS what, COUNT(*) FROM public.properties WHERE owner_id = 'user_35wA9egXXsSfcza1TUROhHcVl8q';
SELECT 'properties_after_new' AS what, COUNT(*) FROM public.properties WHERE owner_id = 'dd2e7137-b972-47a6-b5b5-e4903eb0ecc3';

COMMIT;

-- Notes:
-- 1) This updates only the `properties.owner_id` column. If you want other tables mapped as well, run the broader mapping migration or add additional UPDATEs.
-- 2) Always test on a staging copy first and keep a DB dump for rollback.
