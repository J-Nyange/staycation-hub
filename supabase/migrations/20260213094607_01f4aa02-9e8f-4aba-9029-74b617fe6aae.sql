
-- Drop the foreign key constraint on cancelled_by before changing type
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_cancelled_by_fkey;

-- Expand bookings status constraint
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE bookings ADD CONSTRAINT bookings_status_check 
  CHECK (status IN ('pending','confirmed','cancelled','completed','expired','failed','refunded'));

-- Expand bookings payment_status constraint
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_payment_status_check;
ALTER TABLE bookings ADD CONSTRAINT bookings_payment_status_check
  CHECK (payment_status IN ('pending','paid','refunded','failed','awaiting_contact','paid_offline'));

-- Fix cancelled_by column type from uuid to text (for Clerk user IDs)
ALTER TABLE bookings ALTER COLUMN cancelled_by TYPE text USING cancelled_by::text;

-- Add email column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email text;

-- Allow users to delete their own notifications
CREATE POLICY "Users can delete their own notifications"
  ON notifications FOR DELETE
  USING ((auth.jwt()->>'sub')::text = user_id);
