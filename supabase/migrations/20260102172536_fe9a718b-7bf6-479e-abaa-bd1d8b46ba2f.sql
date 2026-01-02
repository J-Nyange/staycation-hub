-- Phase 1: Partial Payments & Group Bookings

-- Add partial payment columns to bookings table
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_type TEXT DEFAULT 'full';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS deposit_percentage NUMERIC DEFAULT 30;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS deposit_amount NUMERIC;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS deposit_paid_at TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS balance_amount NUMERIC;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS balance_due_date DATE;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS balance_paid_at TIMESTAMPTZ;

-- Add group booking columns to bookings table
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS is_group_booking BOOLEAN DEFAULT false;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS group_size INTEGER;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS group_type TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS dietary_requirements TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS accessibility_needs TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS additional_services JSONB DEFAULT '[]';

-- Add group booking settings to properties table
ALTER TABLE properties ADD COLUMN IF NOT EXISTS group_discount_percentage NUMERIC DEFAULT 0;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS max_group_size INTEGER DEFAULT 20;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS group_booking_enabled BOOLEAN DEFAULT true;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS deposit_percentage NUMERIC DEFAULT 30;

-- Create push_subscriptions table for PWA push notifications
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on push_subscriptions
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS policies for push_subscriptions
CREATE POLICY "Users can manage their own push subscriptions" 
ON push_subscriptions FOR ALL 
USING ((auth.jwt() ->> 'sub'::text) = user_id)
WITH CHECK ((auth.jwt() ->> 'sub'::text) = user_id);

-- Add SMS preferences to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sms_notifications_enabled BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS push_notifications_enabled BOOLEAN DEFAULT true;

-- Create sms_logs table
CREATE TABLE IF NOT EXISTS sms_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  message TEXT NOT NULL,
  message_type TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  twilio_sid TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on sms_logs
ALTER TABLE sms_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for sms_logs
CREATE POLICY "Users can view their own sms logs" 
ON sms_logs FOR SELECT 
USING ((auth.jwt() ->> 'sub'::text) = user_id);

-- Create support_conversations table for live chat
CREATE TABLE IF NOT EXISTS support_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  subject TEXT,
  status TEXT DEFAULT 'open',
  priority TEXT DEFAULT 'normal',
  assigned_to TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ
);

-- Enable RLS on support_conversations
ALTER TABLE support_conversations ENABLE ROW LEVEL SECURITY;

-- RLS policies for support_conversations
CREATE POLICY "Users can manage their own support conversations" 
ON support_conversations FOR ALL 
USING ((auth.jwt() ->> 'sub'::text) = user_id)
WITH CHECK ((auth.jwt() ->> 'sub'::text) = user_id);

CREATE POLICY "Admins can manage all support conversations" 
ON support_conversations FOR ALL 
USING (is_admin());

-- Create support_messages table
CREATE TABLE IF NOT EXISTS support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES support_conversations(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL,
  sender_type TEXT NOT NULL DEFAULT 'user',
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on support_messages
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for support_messages
CREATE POLICY "Users can view messages in their conversations" 
ON support_messages FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM support_conversations 
  WHERE support_conversations.id = support_messages.conversation_id 
  AND support_conversations.user_id = (auth.jwt() ->> 'sub'::text)
));

CREATE POLICY "Users can send messages in their conversations" 
ON support_messages FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM support_conversations 
  WHERE support_conversations.id = support_messages.conversation_id 
  AND support_conversations.user_id = (auth.jwt() ->> 'sub'::text)
) AND sender_id = (auth.jwt() ->> 'sub'::text));

CREATE POLICY "Admins can manage all support messages" 
ON support_messages FOR ALL 
USING (is_admin());

-- Update support_conversation timestamp trigger
CREATE OR REPLACE FUNCTION update_support_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE support_conversations 
  SET updated_at = NOW() 
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_support_conversation_on_message
AFTER INSERT ON support_messages
FOR EACH ROW
EXECUTE FUNCTION update_support_conversation_timestamp();