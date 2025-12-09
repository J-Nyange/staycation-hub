-- Add is_archived column to bookings to support "Clear History" functionality
-- This allows users to hide past bookings without deleting them from the database

ALTER TABLE bookings 
ADD COLUMN is_archived BOOLEAN DEFAULT FALSE;

-- Allow users to update their own bookings' archive status
-- We need to ensure the existing UPDATE policy covers this column, or make sure RLS allows updating it.
-- Based on previous migration (20251209122000_fix_booking_uuid_policies.sql), we have:
-- CREATE POLICY "Users can update their own bookings"
-- ON bookings FOR UPDATE
-- TO authenticated
-- USING (user_id = auth.jwt()->>'sub')
-- WITH CHECK (user_id = auth.jwt()->>'sub');

-- That policy should be sufficient for updating 'is_archived' as long as the user_id doesn't change.
-- No additional policy needed if the generic update policy exists.
