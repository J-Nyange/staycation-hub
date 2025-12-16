-- Add guest contact details to bookings table to store snapshot of contact info at time of booking
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS guest_email TEXT,
ADD COLUMN IF NOT EXISTS guest_phone TEXT;

-- Update RLS policies if necessary (usually strict policies might block updating new columns if not valid, but standard policies are usually row-based)
-- The existing insert policy should cover these new columns as they are part of the row.
