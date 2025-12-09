-- Add accommodation_explanation column to bookings table
-- This column stores explanations from guests who book with more guests than property capacity

ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS accommodation_explanation TEXT DEFAULT NULL;

-- Create index for faster queries on bookings with accommodation explanations
CREATE INDEX IF NOT EXISTS idx_bookings_accommodation_explanation 
ON public.bookings(property_id) 
WHERE accommodation_explanation IS NOT NULL;

-- Add comment to document the new field
COMMENT ON COLUMN public.bookings.accommodation_explanation IS 
'Explanation provided by guest when booking with more guests than property capacity allows';

