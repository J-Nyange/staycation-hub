-- Update all RLS policies to work with Clerk JWT tokens
-- Replace auth.uid() with (auth.jwt()->>'sub')::uuid

-- Profiles table policies
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can create own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;

CREATE POLICY "Users can view their own profile"
ON profiles FOR SELECT
USING ((auth.jwt()->>'sub')::uuid = user_id);

CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE
USING ((auth.jwt()->>'sub')::uuid = user_id);

CREATE POLICY "Users can insert their own profile"
ON profiles FOR INSERT
WITH CHECK ((auth.jwt()->>'sub')::uuid = user_id);

-- Bookings table policies
DROP POLICY IF EXISTS "Users can view own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can view their own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can create bookings" ON bookings;
DROP POLICY IF EXISTS "Users can update their own bookings" ON bookings;
DROP POLICY IF EXISTS "Owners can view property bookings" ON bookings;
DROP POLICY IF EXISTS "Property owners can view bookings for their properties" ON bookings;
DROP POLICY IF EXISTS "Property owners can update bookings for their properties" ON bookings;

CREATE POLICY "Users can view their own bookings"
ON bookings FOR SELECT
USING ((auth.jwt()->>'sub')::uuid = user_id);

CREATE POLICY "Users can create bookings"
ON bookings FOR INSERT
WITH CHECK ((auth.jwt()->>'sub')::uuid = user_id);

CREATE POLICY "Users can update their own bookings"
ON bookings FOR UPDATE
USING ((auth.jwt()->>'sub')::uuid = user_id);

CREATE POLICY "Property owners can view bookings for their properties"
ON bookings FOR SELECT
USING (EXISTS (
  SELECT 1 FROM properties p
  WHERE p.id = bookings.property_id AND p.owner_id = (auth.jwt()->>'sub')::uuid
));

CREATE POLICY "Property owners can update bookings for their properties"
ON bookings FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM properties p
  WHERE p.id = bookings.property_id AND p.owner_id = (auth.jwt()->>'sub')::uuid
));

-- Wishlists table policies
DROP POLICY IF EXISTS "Users can manage own wishlist" ON wishlists;
DROP POLICY IF EXISTS "Users can manage their own wishlists" ON wishlists;
DROP POLICY IF EXISTS "Users can view their own wishlists" ON wishlists;

CREATE POLICY "Users can manage their own wishlists"
ON wishlists FOR ALL
USING ((auth.jwt()->>'sub')::uuid = user_id)
WITH CHECK ((auth.jwt()->>'sub')::uuid = user_id);

-- Reviews table policies
DROP POLICY IF EXISTS "Authenticated users can create reviews" ON reviews;
DROP POLICY IF EXISTS "Users can review after checkout" ON reviews;
DROP POLICY IF EXISTS "Users can update their own reviews" ON reviews;
DROP POLICY IF EXISTS "Users can delete own reviews" ON reviews;
DROP POLICY IF EXISTS "Property owners can reply to reviews" ON reviews;

CREATE POLICY "Authenticated users can create reviews"
ON reviews FOR INSERT
WITH CHECK ((auth.jwt()->>'sub')::uuid = user_id);

CREATE POLICY "Users can review after checkout"
ON reviews FOR INSERT
WITH CHECK (
  (auth.jwt()->>'sub')::uuid = user_id AND
  EXISTS (
    SELECT 1 FROM bookings
    WHERE bookings.id = reviews.booking_id
    AND bookings.user_id = (auth.jwt()->>'sub')::uuid
    AND bookings.status = 'confirmed'
    AND bookings.check_out < CURRENT_DATE
  )
);

CREATE POLICY "Users can update their own reviews"
ON reviews FOR UPDATE
USING ((auth.jwt()->>'sub')::uuid = user_id);

CREATE POLICY "Users can delete own reviews"
ON reviews FOR DELETE
USING ((auth.jwt()->>'sub')::uuid = user_id);

CREATE POLICY "Property owners can reply to reviews"
ON reviews FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM properties
  WHERE properties.id = reviews.property_id
  AND properties.owner_id = (auth.jwt()->>'sub')::uuid
))
WITH CHECK (EXISTS (
  SELECT 1 FROM properties
  WHERE properties.id = reviews.property_id
  AND properties.owner_id = (auth.jwt()->>'sub')::uuid
));

-- Notifications table policies
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;

CREATE POLICY "Users can view their own notifications"
ON notifications FOR SELECT
USING ((auth.jwt()->>'sub')::uuid = user_id);

CREATE POLICY "Users can update their own notifications"
ON notifications FOR UPDATE
USING ((auth.jwt()->>'sub')::uuid = user_id);

-- Conversations table policies
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
DROP POLICY IF EXISTS "Users can view their own conversations" ON conversations;

CREATE POLICY "Users can create conversations"
ON conversations FOR INSERT
WITH CHECK ((auth.jwt()->>'sub')::uuid = guest_id);

CREATE POLICY "Users can view their own conversations"
ON conversations FOR SELECT
USING (
  (auth.jwt()->>'sub')::uuid = guest_id OR
  (auth.jwt()->>'sub')::uuid = owner_id
);

-- Messages table policies
DROP POLICY IF EXISTS "Users can send messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can update messages" ON messages;

CREATE POLICY "Users can send messages in their conversations"
ON messages FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM conversations
    WHERE conversations.id = messages.conversation_id
    AND (
      conversations.guest_id = (auth.jwt()->>'sub')::uuid OR
      conversations.owner_id = (auth.jwt()->>'sub')::uuid
    )
  ) AND (auth.jwt()->>'sub')::uuid = sender_id
);

CREATE POLICY "Users can view messages in their conversations"
ON messages FOR SELECT
USING (EXISTS (
  SELECT 1 FROM conversations
  WHERE conversations.id = messages.conversation_id
  AND (
    conversations.guest_id = (auth.jwt()->>'sub')::uuid OR
    conversations.owner_id = (auth.jwt()->>'sub')::uuid
  )
));

CREATE POLICY "Users can update messages"
ON messages FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM conversations
  WHERE conversations.id = messages.conversation_id
  AND (
    conversations.guest_id = (auth.jwt()->>'sub')::uuid OR
    conversations.owner_id = (auth.jwt()->>'sub')::uuid
  )
));

-- Properties table policies
DROP POLICY IF EXISTS "Authenticated users can create properties" ON properties;
DROP POLICY IF EXISTS "Owners can update properties" ON properties;
DROP POLICY IF EXISTS "Owners can delete properties" ON properties;
DROP POLICY IF EXISTS "Property owners can manage their properties" ON properties;

CREATE POLICY "Authenticated users can create properties"
ON properties FOR INSERT
WITH CHECK ((auth.jwt()->>'sub')::uuid = owner_id);

CREATE POLICY "Property owners can manage their properties"
ON properties FOR ALL
USING ((auth.jwt()->>'sub')::uuid = owner_id);

-- Blocked dates table policies
DROP POLICY IF EXISTS "Property owners can manage blocked dates" ON blocked_dates;

CREATE POLICY "Property owners can manage blocked dates"
ON blocked_dates FOR ALL
USING (EXISTS (
  SELECT 1 FROM properties
  WHERE properties.id = blocked_dates.property_id
  AND properties.owner_id = (auth.jwt()->>'sub')::uuid
));

-- Seasonal pricing table policies
DROP POLICY IF EXISTS "Property owners can manage seasonal pricing" ON seasonal_pricing;

CREATE POLICY "Property owners can manage seasonal pricing"
ON seasonal_pricing FOR ALL
USING (EXISTS (
  SELECT 1 FROM properties
  WHERE properties.id = seasonal_pricing.property_id
  AND properties.owner_id = (auth.jwt()->>'sub')::uuid
));

-- Booking modifications table policies
DROP POLICY IF EXISTS "Users can view their own modification requests" ON booking_modifications;
DROP POLICY IF EXISTS "Users can create modification requests" ON booking_modifications;
DROP POLICY IF EXISTS "Property owners can respond to modifications" ON booking_modifications;

CREATE POLICY "Users can view their own modification requests"
ON booking_modifications FOR SELECT
USING (
  (auth.jwt()->>'sub')::uuid = requested_by OR
  EXISTS (
    SELECT 1 FROM bookings b
    JOIN properties p ON p.id = b.property_id
    WHERE b.id = booking_modifications.booking_id
    AND p.owner_id = (auth.jwt()->>'sub')::uuid
  )
);

CREATE POLICY "Users can create modification requests"
ON booking_modifications FOR INSERT
WITH CHECK ((auth.jwt()->>'sub')::uuid = requested_by);

CREATE POLICY "Property owners can respond to modifications"
ON booking_modifications FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM bookings b
  JOIN properties p ON p.id = b.property_id
  WHERE b.id = booking_modifications.booking_id
  AND p.owner_id = (auth.jwt()->>'sub')::uuid
));

-- Payment transactions table policies
DROP POLICY IF EXISTS "Users can view their own transactions" ON payment_transactions;

CREATE POLICY "Users can view their own transactions"
ON payment_transactions FOR SELECT
USING (EXISTS (
  SELECT 1 FROM bookings
  WHERE bookings.id = payment_transactions.booking_id
  AND bookings.user_id = (auth.jwt()->>'sub')::uuid
));

-- Property earnings table policies
DROP POLICY IF EXISTS "Property owners can view their earnings" ON property_earnings;

CREATE POLICY "Property owners can view their earnings"
ON property_earnings FOR SELECT
USING (EXISTS (
  SELECT 1 FROM properties
  WHERE properties.id = property_earnings.property_id
  AND properties.owner_id = (auth.jwt()->>'sub')::uuid
));

-- Legal agreements table policies
DROP POLICY IF EXISTS "Users can view their own legal agreements" ON legal_agreements;
DROP POLICY IF EXISTS "Users can accept legal agreements" ON legal_agreements;

CREATE POLICY "Users can view their own legal agreements"
ON legal_agreements FOR SELECT
USING ((auth.jwt()->>'sub')::uuid = user_id);

CREATE POLICY "Users can accept legal agreements"
ON legal_agreements FOR INSERT
WITH CHECK ((auth.jwt()->>'sub')::uuid = user_id);

-- Blog posts table policies
DROP POLICY IF EXISTS "Authors can manage their own blog posts" ON blog_posts;

CREATE POLICY "Authors can manage their own blog posts"
ON blog_posts FOR ALL
USING ((auth.jwt()->>'sub')::uuid = author_id);