-- =============================================
-- FIX: Remove permissive booking policies that expose PII
-- Creates a public view for availability checks instead
-- =============================================

-- Step 1: Drop the dangerous permissive policies
DROP POLICY IF EXISTS "Anyone can view bookings" ON bookings;
DROP POLICY IF EXISTS "Anon can insert bookings" ON bookings;
DROP POLICY IF EXISTS "Anon can update bookings with matching user_id" ON bookings;

-- Step 2: Ensure users can still view their own bookings
-- (These may already exist, but we ensure they're in place)
DROP POLICY IF EXISTS "Users can view their own bookings" ON bookings;
CREATE POLICY "Users can view their own bookings"
  ON bookings FOR SELECT TO authenticated
  USING (user_id = (auth.jwt()->>'sub')::text);

-- Step 3: Create a minimal public view for availability checks
-- This view ONLY exposes the data needed for availability checking
-- NO sensitive PII (emails, phones, names, payment info) is exposed
CREATE OR REPLACE VIEW public.public_booking_availability
WITH (security_invoker = true) AS
SELECT 
  property_id,
  check_in,
  check_out,
  status
FROM bookings
WHERE status IN ('confirmed', 'pending');

-- Grant access to the view for both anonymous and authenticated users
GRANT SELECT ON public.public_booking_availability TO anon, authenticated;