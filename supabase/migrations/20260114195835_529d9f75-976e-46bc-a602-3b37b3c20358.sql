-- Update payment_status check constraint to include 'awaiting_contact'
ALTER TABLE bookings 
DROP CONSTRAINT IF EXISTS bookings_payment_status_check;

ALTER TABLE bookings 
ADD CONSTRAINT bookings_payment_status_check 
CHECK (payment_status = ANY (ARRAY['pending'::text, 'paid'::text, 'refunded'::text, 'failed'::text, 'awaiting_contact'::text]));