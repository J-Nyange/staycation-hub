-- Fix properties and bookings visibility for ALL users
-- This migration resolves the issue where logged-in users cannot see properties or their availability status

-- 1. PROPERTIES: Allow everyone to see active properties
-- We drop specific named policies that might be conflicting
DROP POLICY IF EXISTS "Anyone can view active properties" ON properties;
DROP POLICY IF EXISTS "Public can view active properties" ON properties;
DROP POLICY IF EXISTS "Enable read access for all users" ON properties;
DROP POLICY IF EXISTS "Anon can view properties" ON properties;
DROP POLICY IF EXISTS "Authenticated can view properties" ON properties;
DROP POLICY IF EXISTS "Authenticated users can create properties" ON properties;
DROP POLICY IF EXISTS "Property owners can manage their properties" ON properties;

-- Ensure RLS is enabled
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Re-create the main viewing policy for EVERYONE (anon + authenticated)
CREATE POLICY "Anyone can view active properties"
ON properties FOR SELECT
USING (is_active = true);

-- Re-create owner management policies (using correct Clerk ID check)
CREATE POLICY "Authenticated users can create properties"
ON properties FOR INSERT
WITH CHECK (auth.jwt()->>'sub' = owner_id);

CREATE POLICY "Property owners can manage their properties"
ON properties FOR ALL
USING (auth.jwt()->>'sub' = owner_id);


-- 2. BOOKINGS: Fix availability checks
-- Logged-in users need to see ALL bookings to know what is unavailable
-- Currently they only see their own, which breaks availability logic
DROP POLICY IF EXISTS "Users can view their own bookings" ON bookings;
DROP POLICY IF EXISTS "Anon can select bookings" ON bookings;
DROP POLICY IF EXISTS "Anyone can view bookings" ON bookings;

-- Create a blanket read policy for bookings so availability checks work
CREATE POLICY "Anyone can view bookings"
ON bookings FOR SELECT
USING (true);

-- Keep the write policies for users (managing their own bookings)
-- (We assume these already exist from previous migrations, but we ensure the read part is open)
-- If we need to re-verify the specific update/insert policies, we leave them as is or re-declare if needed.
-- For now, we only widened SELECT access.
