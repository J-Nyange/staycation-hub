-- Add cancellation and modification fields to bookings table
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cancelled_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS refund_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS refund_status TEXT DEFAULT 'none' CHECK (refund_status IN ('none', 'pending', 'processing', 'completed', 'failed')),
ADD COLUMN IF NOT EXISTS modification_count INTEGER DEFAULT 0;

-- Create booking_modifications table
CREATE TABLE IF NOT EXISTS booking_modifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES auth.users(id),
  modification_type TEXT NOT NULL CHECK (modification_type IN ('date_change', 'guest_count', 'cancellation')),
  old_check_in DATE,
  old_check_out DATE,
  new_check_in DATE,
  new_check_out DATE,
  old_guests INTEGER,
  new_guests INTEGER,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reason TEXT,
  response TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMPTZ
);

-- Add RLS policies for booking_modifications
ALTER TABLE booking_modifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own modification requests"
  ON booking_modifications FOR SELECT
  USING (
    auth.uid() = requested_by OR
    EXISTS (
      SELECT 1 FROM bookings b
      JOIN properties p ON p.id = b.property_id
      WHERE b.id = booking_modifications.booking_id AND p.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can create modification requests"
  ON booking_modifications FOR INSERT
  WITH CHECK (auth.uid() = requested_by);

CREATE POLICY "Property owners can respond to modifications"
  ON booking_modifications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM bookings b
      JOIN properties p ON p.id = b.property_id
      WHERE b.id = booking_modifications.booking_id AND p.owner_id = auth.uid()
    )
  );

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_booking_modifications_booking_id ON booking_modifications(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_modifications_status ON booking_modifications(status);

-- Update bookings policies to allow owners to see all bookings for their properties
CREATE POLICY "Property owners can view bookings for their properties"
  ON bookings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = bookings.property_id AND p.owner_id = auth.uid()
    )
  );

CREATE POLICY "Property owners can update bookings for their properties"
  ON bookings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = bookings.property_id AND p.owner_id = auth.uid()
    )
  );