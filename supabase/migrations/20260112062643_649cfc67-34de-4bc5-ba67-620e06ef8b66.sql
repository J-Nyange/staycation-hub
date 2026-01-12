-- Fix SECURITY DEFINER view issue by recreating the view with SECURITY INVOKER
DROP VIEW IF EXISTS public_owner_profiles;

CREATE VIEW public_owner_profiles 
WITH (security_invoker = true) AS
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