-- Fix 1: Replace owner_analytics view with a secure RPC function

-- Drop the existing view
DROP VIEW IF EXISTS owner_analytics;

-- Create a SECURITY DEFINER function that validates ownership
CREATE OR REPLACE FUNCTION get_owner_analytics(target_owner_id TEXT)
RETURNS TABLE (
  property_id UUID,
  property_title TEXT,
  total_bookings BIGINT,
  confirmed_bookings BIGINT,
  cancelled_bookings BIGINT,
  pending_bookings BIGINT,
  total_revenue NUMERIC,
  avg_booking_value NUMERIC,
  average_rating NUMERIC,
  review_count BIGINT,
  booking_success_rate NUMERIC,
  avg_stay_duration NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate caller is the owner or admin
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
  LEFT JOIN reviews r ON r.property_id = p.id
  WHERE p.owner_id = target_owner_id
  GROUP BY p.id, p.title;
END;
$$;