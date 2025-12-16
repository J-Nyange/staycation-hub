-- Safely create table if it doesn't exist
CREATE TABLE IF NOT EXISTS booking_modifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  requested_by TEXT NOT NULL,
  modification_type TEXT NOT NULL,
  old_check_in DATE,
  old_check_out DATE,
  new_check_in DATE,
  new_check_out DATE,
  old_guests INTEGER,
  new_guests INTEGER,
  reason TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure requested_by is TEXT (to support Clerk IDs)
DO $$ 
BEGIN
  -- If the column is UUID, this might fail unless we cast, but typically we want TEXT.
  -- We'll try to alter it. If it's already TEXT, this is a no-op or fast.
  ALTER TABLE booking_modifications ALTER COLUMN requested_by TYPE TEXT;
EXCEPTION
  WHEN OTHERS THEN
    NULL; -- Ignore if conversion fails (unlikely if empty) or already correct
END $$;

-- Enable RLS
ALTER TABLE booking_modifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts on recreation
DROP POLICY IF EXISTS "Users can view their own modifications" ON booking_modifications;
DROP POLICY IF EXISTS "Users can create their own modifications" ON booking_modifications;
DROP POLICY IF EXISTS "Owners can view modifications for their bookings" ON booking_modifications;
DROP POLICY IF EXISTS "Owners can update modifications" ON booking_modifications;

-- Re-create Policies
CREATE POLICY "Users can view their own modifications" ON booking_modifications
  FOR SELECT USING (auth.uid()::text = requested_by);

CREATE POLICY "Users can create their own modifications" ON booking_modifications
  FOR INSERT WITH CHECK (auth.uid()::text = requested_by);

CREATE POLICY "Owners can view modifications for their bookings" ON booking_modifications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bookings b
      JOIN properties p ON b.property_id = p.id
      WHERE b.id = booking_modifications.booking_id
      AND p.owner_id = auth.uid()::text
    )
  );

CREATE POLICY "Owners can update modifications" ON booking_modifications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM bookings b
      JOIN properties p ON b.property_id = p.id
      WHERE b.id = booking_modifications.booking_id
      AND p.owner_id = auth.uid()::text
    )
  );

-- Index (IF NOT EXISTS is not standard for CREATE INDEX in all pg versions, so we wrap)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN   pg_namespace n ON n.oid = c.relnamespace
    WHERE  c.relname = 'idx_booking_modifications_booking_id'
  ) THEN
    CREATE INDEX idx_booking_modifications_booking_id ON booking_modifications(booking_id);
  END IF;
END $$;
