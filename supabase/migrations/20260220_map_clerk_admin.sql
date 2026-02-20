-- Migration: Map a Clerk user ID to a Supabase user UUID across application tables
-- USAGE: Edit the values in the `params` CTE below and run in Supabase SQL Editor.
-- OLD_CLERK_ID example: 'user_35wA9egXXsSfcza1TUROhHcVl8q'
-- NEW_SUPABASE_UUID example: '550e8400-e29b-41d4-a716-446655440000'

BEGIN;

WITH params AS (
	SELECT
		'user_35wA9egXXsSfcza1TUROhHcVl8q'::text AS old_clerk_id,
		'550e8400-e29b-41d4-a716-446655440000'::uuid AS new_supabase_id
)

-- Diagnostic: counts before (these SELECTs will return rows in the editor)
SELECT 'profiles' AS object, COUNT(*) AS cnt
FROM public.profiles p, params
WHERE p.user_id = params.old_clerk_id;

SELECT 'properties (owner)' AS object, COUNT(*) AS cnt
FROM public.properties pr, params
WHERE pr.owner_id = params.old_clerk_id;

SELECT 'bookings (user)' AS object, COUNT(*) AS cnt
FROM public.bookings b, params
WHERE b.user_id = params.old_clerk_id;

SELECT 'wishlists' AS object, COUNT(*) AS cnt
FROM public.wishlists w, params
WHERE w.user_id = params.old_clerk_id;

SELECT 'reviews' AS object, COUNT(*) AS cnt
FROM public.reviews r, params
WHERE r.user_id = params.old_clerk_id;

SELECT 'notifications' AS object, COUNT(*) AS cnt
FROM public.notifications n, params
WHERE n.user_id = params.old_clerk_id;

SELECT 'user_roles' AS object, COUNT(*) AS cnt
FROM public.user_roles ur, params
WHERE ur.user_id = params.old_clerk_id;

SELECT 'conversations guest' AS object, COUNT(*) AS cnt
FROM public.conversations c, params
WHERE c.guest_id = params.old_clerk_id;

SELECT 'conversations owner' AS object, COUNT(*) AS cnt
FROM public.conversations c2, params
WHERE c2.owner_id = params.old_clerk_id;

SELECT 'messages sender' AS object, COUNT(*) AS cnt
FROM public.messages m, params
WHERE m.sender_id = params.old_clerk_id;

SELECT 'blog_posts author' AS object, COUNT(*) AS cnt
FROM public.blog_posts bp, params
WHERE bp.author_id = params.old_clerk_id;

SELECT 'booking_modifications requested_by' AS object, COUNT(*) AS cnt
FROM public.booking_modifications bm, params
WHERE bm.requested_by = params.old_clerk_id;

-- Perform updates (cast new id to text for TEXT columns)
UPDATE public.profiles SET user_id = params.new_supabase_id::text
FROM params
WHERE public.profiles.user_id = params.old_clerk_id;

UPDATE public.properties SET owner_id = params.new_supabase_id::text
FROM params
WHERE public.properties.owner_id = params.old_clerk_id;

UPDATE public.bookings SET user_id = params.new_supabase_id::text
FROM params
WHERE public.bookings.user_id = params.old_clerk_id;

UPDATE public.bookings SET cancelled_by = params.new_supabase_id::text
FROM params
WHERE public.bookings.cancelled_by = params.old_clerk_id;

UPDATE public.wishlists SET user_id = params.new_supabase_id::text
FROM params
WHERE public.wishlists.user_id = params.old_clerk_id;

UPDATE public.reviews SET user_id = params.new_supabase_id::text
FROM params
WHERE public.reviews.user_id = params.old_clerk_id;

UPDATE public.notifications SET user_id = params.new_supabase_id::text
FROM params
WHERE public.notifications.user_id = params.old_clerk_id;

UPDATE public.user_roles SET user_id = params.new_supabase_id::text
FROM params
WHERE public.user_roles.user_id = params.old_clerk_id;

UPDATE public.conversations SET guest_id = params.new_supabase_id::text
FROM params
WHERE public.conversations.guest_id = params.old_clerk_id;

UPDATE public.conversations SET owner_id = params.new_supabase_id::text
FROM params
WHERE public.conversations.owner_id = params.old_clerk_id;

UPDATE public.messages SET sender_id = params.new_supabase_id::text
FROM params
WHERE public.messages.sender_id = params.old_clerk_id;

UPDATE public.blog_posts SET author_id = params.new_supabase_id::text
FROM params
WHERE public.blog_posts.author_id = params.old_clerk_id;

UPDATE public.booking_modifications SET requested_by = params.new_supabase_id::text
FROM params
WHERE public.booking_modifications.requested_by = params.old_clerk_id;

UPDATE public.legal_agreements SET user_id = params.new_supabase_id::text
FROM params
WHERE public.legal_agreements.user_id = params.old_clerk_id;

-- Diagnostic: counts after
SELECT 'profiles (old)' AS object, COUNT(*) AS cnt
FROM public.profiles p, params
WHERE p.user_id = params.old_clerk_id;

SELECT 'profiles (new)' AS object, COUNT(*) AS cnt
FROM public.profiles p2, params
WHERE p2.user_id = params.new_supabase_id::text;

COMMIT;

-- Notes:
-- 1) Edit the values in the `params` CTE above before running in Supabase SQL Editor.
-- 2) Run on a backup or staging first. Keep a dump of the DB in case rollback is needed.
-- 3) If you need to run this for multiple users, generate a mapping table and run join-based updates instead.
