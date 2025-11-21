-- Phase 11: Create notifications system
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('booking', 'message', 'review', 'payment', 'system', 'property_update')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_notifications ON notifications(user_id, created_at DESC);
CREATE INDEX idx_unread_notifications ON notifications(user_id, is_read) WHERE is_read = FALSE;

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Trigger function to notify property owner on new booking
CREATE OR REPLACE FUNCTION notify_new_booking()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, message, action_url, metadata)
  SELECT 
    p.owner_id,
    'booking',
    'New Booking Request',
    'You have a new booking for ' || p.title,
    '/owner-dashboard',
    jsonb_build_object('booking_id', NEW.id, 'property_id', NEW.property_id)
  FROM properties p 
  WHERE p.id = NEW.property_id AND p.owner_id IS NOT NULL;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_booking_created
  AFTER INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_booking();

-- Trigger function to notify on booking status change
CREATE OR REPLACE FUNCTION notify_booking_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status != OLD.status THEN
    INSERT INTO notifications (user_id, type, title, message, action_url, metadata)
    VALUES (
      NEW.user_id,
      'booking',
      'Booking Status Updated',
      'Your booking status has been updated to ' || NEW.status,
      '/booking-history',
      jsonb_build_object('booking_id', NEW.id, 'old_status', OLD.status, 'new_status', NEW.status)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_booking_status_changed
  AFTER UPDATE ON bookings
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION notify_booking_status_change();

-- Trigger function to notify on new review
CREATE OR REPLACE FUNCTION notify_new_review()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, message, action_url, metadata)
  SELECT 
    p.owner_id,
    'review',
    'New Review Received',
    'You have a new ' || NEW.rating || '-star review for ' || p.title,
    '/my-properties',
    jsonb_build_object('review_id', NEW.id, 'property_id', NEW.property_id, 'rating', NEW.rating)
  FROM properties p 
  WHERE p.id = NEW.property_id AND p.owner_id IS NOT NULL;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_review_created
  AFTER INSERT ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_review();