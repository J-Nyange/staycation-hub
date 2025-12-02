-- Fix Clerk authentication by changing user_id from UUID to TEXT
-- Clerk uses string-based user IDs like "user_36HRNZInWxglaXQYz6Zxl2OdRQA"
-- We need to drop foreign keys to auth.users since Clerk manages authentication

-- Step 1: Drop ALL existing policies first (they depend on the columns)
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can create own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;

DROP POLICY IF EXISTS "Users can view own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can view their own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can create bookings" ON bookings;
DROP POLICY IF EXISTS "Users can update their own bookings" ON bookings;
DROP POLICY IF EXISTS "Owners can view property bookings" ON bookings;
DROP POLICY IF EXISTS "Property owners can view bookings for their properties" ON bookings;
DROP POLICY IF EXISTS "Property owners can update bookings for their properties" ON bookings;

DROP POLICY IF EXISTS "Users can manage own wishlist" ON wishlists;
DROP POLICY IF EXISTS "Users can manage their own wishlists" ON wishlists;
DROP POLICY IF EXISTS "Users can view their own wishlists" ON wishlists;

DROP POLICY IF EXISTS "Authenticated users can create reviews" ON reviews;
DROP POLICY IF EXISTS "Users can create reviews" ON reviews;
DROP POLICY IF EXISTS "Users can review after checkout" ON reviews;
DROP POLICY IF EXISTS "Users can update their own reviews" ON reviews;
DROP POLICY IF EXISTS "Users can delete own reviews" ON reviews;
DROP POLICY IF EXISTS "Property owners can reply to reviews" ON reviews;
DROP POLICY IF EXISTS "Anyone can view reviews" ON reviews;

DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;

DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
DROP POLICY IF EXISTS "Users can view their own conversations" ON conversations;

DROP POLICY IF EXISTS "Users can send messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can update messages" ON messages;

DROP POLICY IF EXISTS "Authenticated users can create properties" ON properties;
DROP POLICY IF EXISTS "Owners can update properties" ON properties;
DROP POLICY IF EXISTS "Owners can delete properties" ON properties;
DROP POLICY IF EXISTS "Property owners can manage their properties" ON properties;
DROP POLICY IF EXISTS "Anyone can view active properties" ON properties;

DROP POLICY IF EXISTS "Property owners can manage blocked dates" ON blocked_dates;

DROP POLICY IF EXISTS "Property owners can manage seasonal pricing" ON seasonal_pricing;

DROP POLICY IF EXISTS "Users can view their own modification requests" ON booking_modifications;
DROP POLICY IF EXISTS "Users can create modification requests" ON booking_modifications;
DROP POLICY IF EXISTS "Property owners can respond to modifications" ON booking_modifications;

DROP POLICY IF EXISTS "Users can view their own transactions" ON payment_transactions;

DROP POLICY IF EXISTS "Property owners can view their earnings" ON property_earnings;

DROP POLICY IF EXISTS "Users can view their own legal agreements" ON legal_agreements;
DROP POLICY IF EXISTS "Users can accept legal agreements" ON legal_agreements;

DROP POLICY IF EXISTS "Authors can manage their own blog posts" ON blog_posts;
DROP POLICY IF EXISTS "Anyone can view published blog posts" ON blog_posts;

-- Step 2: Drop views and functions that depend on owner_id or user_id columns
DROP VIEW IF EXISTS owner_analytics CASCADE;
DROP FUNCTION IF EXISTS get_revenue_by_month(UUID, DATE, DATE);

-- Step 3: Drop the trigger that auto-creates profiles (it references auth.users)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Step 4: Drop all foreign key constraints to auth.users
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;
ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_owner_id_fkey;
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_user_id_fkey;
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_user_id_fkey;
ALTER TABLE wishlists DROP CONSTRAINT IF EXISTS wishlists_user_id_fkey;
ALTER TABLE blog_posts DROP CONSTRAINT IF EXISTS blog_posts_author_id_fkey;
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_guest_id_fkey;
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_owner_id_fkey;
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;
ALTER TABLE booking_modifications DROP CONSTRAINT IF EXISTS booking_modifications_requested_by_fkey;
ALTER TABLE legal_agreements DROP CONSTRAINT IF EXISTS legal_agreements_user_id_fkey;

-- Step 5: Change all user_id columns from UUID to TEXT
ALTER TABLE profiles 
  ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;

ALTER TABLE properties 
  ALTER COLUMN owner_id TYPE TEXT USING owner_id::TEXT;

ALTER TABLE bookings 
  ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;

ALTER TABLE wishlists 
  ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;

ALTER TABLE reviews 
  ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;

ALTER TABLE notifications 
  ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;

ALTER TABLE conversations 
  ALTER COLUMN guest_id TYPE TEXT USING guest_id::TEXT,
  ALTER COLUMN owner_id TYPE TEXT USING owner_id::TEXT;

ALTER TABLE messages 
  ALTER COLUMN sender_id TYPE TEXT USING sender_id::TEXT;

ALTER TABLE booking_modifications 
  ALTER COLUMN requested_by TYPE TEXT USING requested_by::TEXT;

ALTER TABLE legal_agreements 
  ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;

ALTER TABLE blog_posts 
  ALTER COLUMN author_id TYPE TEXT USING author_id::TEXT;

-- Step 6: Recreate the owner_analytics view with TEXT owner_id
CREATE OR REPLACE VIEW owner_analytics AS
SELECT 
  p.owner_id,
  p.id as property_id,
  p.title as property_title,
  COUNT(DISTINCT b.id) as total_bookings,
  COUNT(DISTINCT b.id) FILTER (WHERE b.status = 'confirmed') as confirmed_bookings,
  COUNT(DISTINCT b.id) FILTER (WHERE b.status = 'cancelled') as cancelled_bookings,
  COUNT(DISTINCT b.id) FILTER (WHERE b.status = 'pending') as pending_bookings,
  COALESCE(SUM(b.total_price) FILTER (WHERE b.status = 'confirmed'), 0) as total_revenue,
  COALESCE(AVG(b.total_price) FILTER (WHERE b.status = 'confirmed'), 0) as avg_booking_value,
  COALESCE(AVG(r.rating), 0) as average_rating,
  COUNT(DISTINCT r.id) as review_count,
  CASE 
    WHEN COUNT(DISTINCT b.id) FILTER (WHERE b.status IN ('confirmed', 'cancelled')) > 0 
    THEN (COUNT(DISTINCT b.id) FILTER (WHERE b.status = 'confirmed')::FLOAT / 
          COUNT(DISTINCT b.id) FILTER (WHERE b.status IN ('confirmed', 'cancelled'))) * 100
    ELSE 0
  END as booking_success_rate,
  COALESCE(AVG(b.check_out::date - b.check_in::date) FILTER (WHERE b.status = 'confirmed'), 0) as avg_stay_duration
FROM properties p
LEFT JOIN bookings b ON b.property_id = p.id
LEFT JOIN reviews r ON r.property_id = p.id
WHERE p.owner_id IS NOT NULL
GROUP BY p.owner_id, p.id, p.title;

-- Step 7: Recreate the get_revenue_by_month function with TEXT owner_id
CREATE OR REPLACE FUNCTION get_revenue_by_month(
  owner_text TEXT,
  start_date DATE,
  end_date DATE
)
RETURNS TABLE (
  month TEXT,
  revenue NUMERIC,
  booking_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    TO_CHAR(b.created_at, 'YYYY-MM') as month,
    COALESCE(SUM(b.total_price), 0) as revenue,
    COUNT(b.id) as booking_count
  FROM bookings b
  JOIN properties p ON p.id = b.property_id
  WHERE p.owner_id = owner_text
    AND b.status = 'confirmed'
    AND b.created_at::date >= start_date
    AND b.created_at::date <= end_date
  GROUP BY TO_CHAR(b.created_at, 'YYYY-MM')
  ORDER BY month;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Step 8: Recreate all RLS policies with TEXT-based user IDs

-- Profiles table policies
CREATE POLICY "Users can view their own profile"
ON profiles FOR SELECT
USING (auth.jwt()->>'sub' = user_id);

CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE
USING (auth.jwt()->>'sub' = user_id);

CREATE POLICY "Users can insert their own profile"
ON profiles FOR INSERT
WITH CHECK (auth.jwt()->>'sub' = user_id);

-- Bookings table policies
CREATE POLICY "Users can view their own bookings"
ON bookings FOR SELECT
USING (auth.jwt()->>'sub' = user_id);

CREATE POLICY "Users can create bookings"
ON bookings FOR INSERT
WITH CHECK (auth.jwt()->>'sub' = user_id);

CREATE POLICY "Users can update their own bookings"
ON bookings FOR UPDATE
USING (auth.jwt()->>'sub' = user_id);

CREATE POLICY "Property owners can view bookings for their properties"
ON bookings FOR SELECT
USING (EXISTS (
  SELECT 1 FROM properties p
  WHERE p.id = bookings.property_id AND p.owner_id = auth.jwt()->>'sub'
));

CREATE POLICY "Property owners can update bookings for their properties"
ON bookings FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM properties p
  WHERE p.id = bookings.property_id AND p.owner_id = auth.jwt()->>'sub'
));

-- Wishlists table policies
CREATE POLICY "Users can manage their own wishlists"
ON wishlists FOR ALL
USING (auth.jwt()->>'sub' = user_id)
WITH CHECK (auth.jwt()->>'sub' = user_id);

-- Reviews table policies
CREATE POLICY "Anyone can view reviews"
ON reviews FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create reviews"
ON reviews FOR INSERT
WITH CHECK (auth.jwt()->>'sub' = user_id);

CREATE POLICY "Users can review after checkout"
ON reviews FOR INSERT
WITH CHECK (
  auth.jwt()->>'sub' = user_id AND
  EXISTS (
    SELECT 1 FROM bookings
    WHERE bookings.id = reviews.booking_id
    AND bookings.user_id = auth.jwt()->>'sub'
    AND bookings.status = 'confirmed'
    AND bookings.check_out < CURRENT_DATE
  )
);

CREATE POLICY "Users can update their own reviews"
ON reviews FOR UPDATE
USING (auth.jwt()->>'sub' = user_id);

CREATE POLICY "Users can delete own reviews"
ON reviews FOR DELETE
USING (auth.jwt()->>'sub' = user_id);

CREATE POLICY "Property owners can reply to reviews"
ON reviews FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM properties
  WHERE properties.id = reviews.property_id
  AND properties.owner_id = auth.jwt()->>'sub'
))
WITH CHECK (EXISTS (
  SELECT 1 FROM properties
  WHERE properties.id = reviews.property_id
  AND properties.owner_id = auth.jwt()->>'sub'
));

-- Notifications table policies
CREATE POLICY "Users can view their own notifications"
ON notifications FOR SELECT
USING (auth.jwt()->>'sub' = user_id);

CREATE POLICY "Users can update their own notifications"
ON notifications FOR UPDATE
USING (auth.jwt()->>'sub' = user_id);

-- Conversations table policies
CREATE POLICY "Users can create conversations"
ON conversations FOR INSERT
WITH CHECK (auth.jwt()->>'sub' = guest_id);

CREATE POLICY "Users can view their own conversations"
ON conversations FOR SELECT
USING (
  auth.jwt()->>'sub' = guest_id OR
  auth.jwt()->>'sub' = owner_id
);

-- Messages table policies
CREATE POLICY "Users can send messages in their conversations"
ON messages FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM conversations
    WHERE conversations.id = messages.conversation_id
    AND (
      conversations.guest_id = auth.jwt()->>'sub' OR
      conversations.owner_id = auth.jwt()->>'sub'
    )
  ) AND auth.jwt()->>'sub' = sender_id
);

CREATE POLICY "Users can view messages in their conversations"
ON messages FOR SELECT
USING (EXISTS (
  SELECT 1 FROM conversations
  WHERE conversations.id = messages.conversation_id
  AND (
    conversations.guest_id = auth.jwt()->>'sub' OR
    conversations.owner_id = auth.jwt()->>'sub'
  )
));

CREATE POLICY "Users can update messages"
ON messages FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM conversations
  WHERE conversations.id = messages.conversation_id
  AND (
    conversations.guest_id = auth.jwt()->>'sub' OR
    conversations.owner_id = auth.jwt()->>'sub'
  )
));

-- Properties table policies
CREATE POLICY "Anyone can view active properties"
ON properties FOR SELECT
USING (is_active = true);

CREATE POLICY "Authenticated users can create properties"
ON properties FOR INSERT
WITH CHECK (auth.jwt()->>'sub' = owner_id);

CREATE POLICY "Property owners can manage their properties"
ON properties FOR ALL
USING (auth.jwt()->>'sub' = owner_id);

-- Blocked dates table policies
CREATE POLICY "Property owners can manage blocked dates"
ON blocked_dates FOR ALL
USING (EXISTS (
  SELECT 1 FROM properties
  WHERE properties.id = blocked_dates.property_id
  AND properties.owner_id = auth.jwt()->>'sub'
));

-- Seasonal pricing table policies
CREATE POLICY "Property owners can manage seasonal pricing"
ON seasonal_pricing FOR ALL
USING (EXISTS (
  SELECT 1 FROM properties
  WHERE properties.id = seasonal_pricing.property_id
  AND properties.owner_id = auth.jwt()->>'sub'
));

-- Booking modifications table policies
CREATE POLICY "Users can view their own modification requests"
ON booking_modifications FOR SELECT
USING (
  auth.jwt()->>'sub' = requested_by OR
  EXISTS (
    SELECT 1 FROM bookings b
    JOIN properties p ON p.id = b.property_id
    WHERE b.id = booking_modifications.booking_id
    AND p.owner_id = auth.jwt()->>'sub'
  )
);

CREATE POLICY "Users can create modification requests"
ON booking_modifications FOR INSERT
WITH CHECK (auth.jwt()->>'sub' = requested_by);

CREATE POLICY "Property owners can respond to modifications"
ON booking_modifications FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM bookings b
  JOIN properties p ON p.id = b.property_id
  WHERE b.id = booking_modifications.booking_id
  AND p.owner_id = auth.jwt()->>'sub'
));

-- Payment transactions table policies
CREATE POLICY "Users can view their own transactions"
ON payment_transactions FOR SELECT
USING (EXISTS (
  SELECT 1 FROM bookings
  WHERE bookings.id = payment_transactions.booking_id
  AND bookings.user_id = auth.jwt()->>'sub'
));

-- Property earnings table policies
CREATE POLICY "Property owners can view their earnings"
ON property_earnings FOR SELECT
USING (EXISTS (
  SELECT 1 FROM properties
  WHERE properties.id = property_earnings.property_id
  AND properties.owner_id = auth.jwt()->>'sub'
));

-- Legal agreements table policies
CREATE POLICY "Users can view their own legal agreements"
ON legal_agreements FOR SELECT
USING (auth.jwt()->>'sub' = user_id);

CREATE POLICY "Users can accept legal agreements"
ON legal_agreements FOR INSERT
WITH CHECK (auth.jwt()->>'sub' = user_id);

-- Blog posts table policies
CREATE POLICY "Anyone can view published blog posts"
ON blog_posts FOR SELECT
USING (is_published = true);

CREATE POLICY "Authors can manage their own blog posts"
ON blog_posts FOR ALL
USING (auth.jwt()->>'sub' = author_id);
