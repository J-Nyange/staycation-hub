-- Add expires_at column to bookings table for 15-minute payment timeout
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS expires_at timestamp with time zone;

-- Create index for efficient querying of expired bookings
CREATE INDEX IF NOT EXISTS idx_bookings_expires_at ON public.bookings(expires_at) WHERE status = 'pending' AND payment_status = 'pending';