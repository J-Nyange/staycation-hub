-- Add guest_name column to bookings table
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS guest_name text;