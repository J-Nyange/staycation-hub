
-- Fix 1: notify_new_message trigger - change recipient_id from UUID to TEXT
CREATE OR REPLACE FUNCTION public.notify_new_message()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
DECLARE
  recipient_id TEXT;
BEGIN
  SELECT CASE 
    WHEN NEW.sender_id = c.guest_id THEN c.owner_id
    ELSE c.guest_id
  END INTO recipient_id
  FROM conversations c
  WHERE c.id = NEW.conversation_id;
  
  INSERT INTO notifications (user_id, type, title, message, action_url, metadata)
  VALUES (
    recipient_id, 'message', 'New Message', 'You have a new message',
    '/messages',
    jsonb_build_object('conversation_id', NEW.conversation_id, 'message_id', NEW.id)
  );
  RETURN NEW;
END;
$function$;

-- Fix 2: Update get_owner_analytics to accept date range params
CREATE OR REPLACE FUNCTION public.get_owner_analytics(
  target_owner_id text,
  start_date date DEFAULT '2020-01-01'::date,
  end_date date DEFAULT CURRENT_DATE
)
RETURNS TABLE(
  property_id uuid,
  property_title text,
  total_bookings bigint,
  confirmed_bookings bigint,
  cancelled_bookings bigint,
  pending_bookings bigint,
  total_revenue numeric,
  avg_booking_value numeric,
  average_rating numeric,
  review_count bigint,
  booking_success_rate numeric,
  avg_stay_duration numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF target_owner_id != (auth.jwt()->>'sub')::TEXT 
     AND NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: You can only view your own analytics';
  END IF;
  
  RETURN QUERY
  SELECT 
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
      WHEN COUNT(DISTINCT b.id) > 0 
      THEN (COUNT(DISTINCT b.id) FILTER (WHERE b.status = 'confirmed')::NUMERIC / COUNT(DISTINCT b.id)::NUMERIC * 100)
      ELSE 0 
    END as booking_success_rate,
    COALESCE(AVG(b.check_out - b.check_in), 0) as avg_stay_duration
  FROM properties p
  LEFT JOIN bookings b ON b.property_id = p.id
    AND b.created_at::date >= start_date
    AND b.created_at::date <= end_date
  LEFT JOIN reviews r ON r.property_id = p.id
  WHERE p.owner_id = target_owner_id
  GROUP BY p.id, p.title;
END;
$function$;
