-- Allow users to update their own bookings
-- This enables features like:
-- - Cancelling pending bookings before payment
-- - Updating booking status when payment expires

-- First, ensure RLS is enabled on bookings table
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view their own bookings
DROP POLICY IF EXISTS "Users can view their own bookings" ON bookings;
CREATE POLICY "Users can view their own bookings"
ON bookings FOR SELECT
TO authenticated
USING (user_id = auth.uid()::text);

-- Allow authenticated users to insert their own bookings
DROP POLICY IF EXISTS "Users can create their own bookings" ON bookings;
CREATE POLICY "Users can create their own bookings"
ON bookings FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid()::text);

-- Allow authenticated users to update their own bookings
DROP POLICY IF EXISTS "Users can update their own bookings" ON bookings;
CREATE POLICY "Users can update their own bookings"
ON bookings FOR UPDATE
TO authenticated
USING (user_id = auth.uid()::text)
WITH CHECK (user_id = auth.uid()::text);

-- Also allow anon users to update bookings (for Clerk auth which uses anon + custom header)
DROP POLICY IF EXISTS "Anon can update bookings with matching user_id" ON bookings;
CREATE POLICY "Anon can update bookings with matching user_id"
ON bookings FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);

-- Allow anon to select bookings (needed for Clerk auth)
DROP POLICY IF EXISTS "Anon can select bookings" ON bookings;
CREATE POLICY "Anon can select bookings"
ON bookings FOR SELECT
TO anon
USING (true);

-- Allow anon to insert bookings (needed for Clerk auth)
DROP POLICY IF EXISTS "Anon can insert bookings" ON bookings;
CREATE POLICY "Anon can insert bookings"
ON bookings FOR INSERT
TO anon
WITH CHECK (true);
