-- Fix PUBLIC_DATA_EXPOSURE: Remove overly permissive public read policy on profiles
-- The current policy "Public read access for profiles" with USING (true) exposes all user data

-- Drop the overly permissive public read policy
DROP POLICY IF EXISTS "Public read access for profiles" ON profiles;

-- Revoke direct SELECT grants from anon role on profiles
REVOKE SELECT ON profiles FROM anon;

-- The existing policies already handle the proper access:
-- "Users can view their own profile" - users can see their own profile
-- "Users can view own profile" - duplicate, but fine to keep
-- "Admins can view all profiles" - admins can see all

-- Create a minimal public view for property owners (for displaying owner info on property pages)
-- This only exposes non-sensitive information
CREATE OR REPLACE VIEW public_owner_profiles AS
SELECT 
  user_id,
  first_name,
  avatar_url,
  bio,
  is_property_owner
FROM profiles
WHERE is_property_owner = true;

-- Grant select on the view to anon and authenticated users
GRANT SELECT ON public_owner_profiles TO anon;
GRANT SELECT ON public_owner_profiles TO authenticated;

-- Add a policy for viewing minimal property owner info when needed
-- This allows fetching owner name/avatar when viewing properties
CREATE POLICY "Anyone can view property owner basic info"
ON profiles FOR SELECT
USING (
  is_property_owner = true 
  AND EXISTS (
    SELECT 1 FROM properties 
    WHERE properties.owner_id = profiles.user_id 
    AND properties.is_active = true
  )
);