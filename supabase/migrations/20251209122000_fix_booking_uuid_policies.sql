-- Fix "Invalid input syntax for type uuid" error in booking policies
-- This error is caused by auth.uid() trying to cast Clerk IDs (which are not UUIDs) to UUID
-- We must use auth.jwt()->>'sub' instead

-- Fix "Users can create their own bookings"
DROP POLICY IF EXISTS "Users can create their own bookings" ON bookings;
CREATE POLICY "Users can create their own bookings"
ON bookings FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.jwt()->>'sub');

-- Fix "Users can update their own bookings"
DROP POLICY IF EXISTS "Users can update their own bookings" ON bookings;
CREATE POLICY "Users can update their own bookings"
ON bookings FOR UPDATE
TO authenticated
USING (user_id = auth.jwt()->>'sub')
WITH CHECK (user_id = auth.jwt()->>'sub');

-- Ensure no other policies use auth.uid() regarding users (owner policies usually compare owner_id vs sub, which is fine if both are text)
-- Just in case, we also check "Users can create bookings" which might be a duplicate name from another migration
DROP POLICY IF EXISTS "Users can create bookings" ON bookings;
CREATE POLICY "Users can create bookings"
ON bookings FOR INSERT
WITH CHECK (auth.jwt()->>'sub' = user_id);
-- (The above recreates it safely)
