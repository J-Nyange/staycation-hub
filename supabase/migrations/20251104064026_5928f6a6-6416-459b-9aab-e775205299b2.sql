-- ============================================
-- PHASE 1: STRIPE PAYMENT INTEGRATION
-- ============================================

-- Add payment-related columns to bookings table
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text,
ADD COLUMN IF NOT EXISTS commission_amount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS payout_status text DEFAULT 'pending' CHECK (payout_status IN ('pending', 'processing', 'completed', 'failed'));

-- Add Stripe fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS stripe_customer_id text,
ADD COLUMN IF NOT EXISTS stripe_connect_account_id text,
ADD COLUMN IF NOT EXISTS is_property_owner boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS total_earnings numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS pending_payout numeric DEFAULT 0;

-- Create payment_transactions table
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE,
  stripe_payment_intent_id text NOT NULL,
  amount numeric NOT NULL,
  currency text DEFAULT 'usd',
  status text NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),
  payment_method text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on payment_transactions
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- Users can view their own payment transactions
CREATE POLICY "Users can view their own transactions"
ON public.payment_transactions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.bookings
    WHERE bookings.id = payment_transactions.booking_id
    AND bookings.user_id = auth.uid()
  )
);

-- Add commission_rate to properties table
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS commission_rate numeric DEFAULT 15 CHECK (commission_rate >= 0 AND commission_rate <= 100);

-- Create property_earnings table
CREATE TABLE IF NOT EXISTS public.property_earnings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  gross_amount numeric NOT NULL,
  commission_amount numeric NOT NULL,
  net_amount numeric NOT NULL,
  payout_status text DEFAULT 'pending' CHECK (payout_status IN ('pending', 'processing', 'completed', 'failed')),
  payout_date date,
  stripe_transfer_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on property_earnings
ALTER TABLE public.property_earnings ENABLE ROW LEVEL SECURITY;

-- Property owners can view their own earnings
CREATE POLICY "Property owners can view their earnings"
ON public.property_earnings
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.properties
    WHERE properties.id = property_earnings.property_id
    AND properties.owner_id = auth.uid()
  )
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_property_earnings_property_id ON public.property_earnings(property_id);
CREATE INDEX IF NOT EXISTS idx_property_earnings_booking_id ON public.property_earnings(booking_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_booking_id ON public.payment_transactions(booking_id);

-- ============================================
-- PHASE 3: VERIFIED REVIEWS SYSTEM
-- ============================================

-- Add new columns to reviews table
ALTER TABLE public.reviews
ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS helpful_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS review_response text,
ADD COLUMN IF NOT EXISTS photos text[] DEFAULT '{}';

-- Update RLS policy: Users can only review after completed stays
DROP POLICY IF EXISTS "Users can create reviews" ON public.reviews;

CREATE POLICY "Users can review after checkout"
ON public.reviews
FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM public.bookings
    WHERE bookings.id = reviews.booking_id
    AND bookings.user_id = auth.uid()
    AND bookings.status = 'confirmed'
    AND bookings.check_out < CURRENT_DATE
  )
);

-- Property owners can reply to reviews on their properties
CREATE POLICY "Property owners can reply to reviews"
ON public.reviews
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.properties
    WHERE properties.id = reviews.property_id
    AND properties.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.properties
    WHERE properties.id = reviews.property_id
    AND properties.owner_id = auth.uid()
  )
);

-- One review per booking constraint
CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_booking_id_unique ON public.reviews(booking_id) WHERE booking_id IS NOT NULL;

-- ============================================
-- PHASE 4: ADVANCED SEARCH & FILTERS
-- ============================================

-- Add location and property type fields
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS latitude numeric,
ADD COLUMN IF NOT EXISTS longitude numeric,
ADD COLUMN IF NOT EXISTS property_type text CHECK (property_type IN ('beachfront', 'city-center', 'countryside', 'mountain', 'lakefront', 'urban', 'rural')),
ADD COLUMN IF NOT EXISTS instant_book boolean DEFAULT false;

-- Create full-text search index
CREATE INDEX IF NOT EXISTS idx_properties_search ON public.properties USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));

-- Create spatial index for location-based queries
CREATE INDEX IF NOT EXISTS idx_properties_location ON public.properties(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- ============================================
-- PHASE 5: LEGAL COMPLIANCE & TRUST
-- ============================================

-- Add cancellation_policy to properties
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS cancellation_policy text DEFAULT 'flexible' CHECK (cancellation_policy IN ('flexible', 'moderate', 'strict'));

-- Add terms acceptance to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS accepted_terms_at timestamp with time zone;

-- Create legal_agreements table
CREATE TABLE IF NOT EXISTS public.legal_agreements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agreement_type text NOT NULL CHECK (agreement_type IN ('terms_of_service', 'privacy_policy', 'cookie_policy')),
  version text NOT NULL,
  accepted_at timestamp with time zone NOT NULL DEFAULT now(),
  ip_address text,
  UNIQUE(user_id, agreement_type, version)
);

-- Enable RLS on legal_agreements
ALTER TABLE public.legal_agreements ENABLE ROW LEVEL SECURITY;

-- Users can view their own legal agreements
CREATE POLICY "Users can view their own legal agreements"
ON public.legal_agreements
FOR SELECT
USING (auth.uid() = user_id);

-- Users can accept legal agreements
CREATE POLICY "Users can accept legal agreements"
ON public.legal_agreements
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- ============================================
-- TRIGGERS FOR TIMESTAMPS
-- ============================================

-- Update trigger for payment_transactions
CREATE TRIGGER update_payment_transactions_updated_at
BEFORE UPDATE ON public.payment_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();