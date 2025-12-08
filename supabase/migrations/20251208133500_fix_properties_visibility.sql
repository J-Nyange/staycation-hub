-- Fix properties visibility for ALL users (logged in and logged out)
-- Run this in Supabase Dashboard → SQL Editor

-- Drop all existing SELECT policies on properties
DROP POLICY IF EXISTS "Anyone can view active properties" ON properties;
DROP POLICY IF EXISTS "Public can view active properties" ON properties;
DROP POLICY IF EXISTS "Enable read access for all users" ON properties;
DROP POLICY IF EXISTS "Anon can view properties" ON properties;
DROP POLICY IF EXISTS "Authenticated can view properties" ON properties;

-- Create a simple policy that works for ALL roles
-- By not specifying TO, it applies to everyone
CREATE POLICY "Anyone can view active properties"
ON properties FOR SELECT
USING (is_active = true);

