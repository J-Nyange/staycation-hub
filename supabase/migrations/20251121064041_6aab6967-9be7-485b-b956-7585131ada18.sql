-- Phase 9: Create analytics views and functions
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

-- Create function to get revenue by date range
CREATE OR REPLACE FUNCTION get_revenue_by_month(
  owner_uuid UUID,
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
  WHERE p.owner_id = owner_uuid
    AND b.status = 'confirmed'
    AND b.created_at::date >= start_date
    AND b.created_at::date <= end_date
  GROUP BY TO_CHAR(b.created_at, 'YYYY-MM')
  ORDER BY month;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_property_earnings_property ON property_earnings(property_id);
CREATE INDEX IF NOT EXISTS idx_reviews_property ON reviews(property_id);