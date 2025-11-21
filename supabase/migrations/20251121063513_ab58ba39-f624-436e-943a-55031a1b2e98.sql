-- Phase 7: Create calendar and availability tables
CREATE TABLE blocked_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  blocked_date DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(property_id, blocked_date)
);

CREATE TABLE seasonal_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  price_per_night DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (end_date >= start_date)
);

CREATE INDEX idx_blocked_dates_property ON blocked_dates(property_id, blocked_date);
CREATE INDEX idx_seasonal_pricing_property ON seasonal_pricing(property_id, start_date, end_date);

ALTER TABLE blocked_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE seasonal_pricing ENABLE ROW LEVEL SECURITY;

-- Property owners can manage their blocked dates
CREATE POLICY "Property owners can manage blocked dates" ON blocked_dates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM properties 
      WHERE properties.id = blocked_dates.property_id 
      AND properties.owner_id = auth.uid()
    )
  );

-- Anyone can view blocked dates to check availability
CREATE POLICY "Anyone can view blocked dates" ON blocked_dates
  FOR SELECT USING (true);

-- Property owners can manage seasonal pricing
CREATE POLICY "Property owners can manage seasonal pricing" ON seasonal_pricing
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM properties 
      WHERE properties.id = seasonal_pricing.property_id 
      AND properties.owner_id = auth.uid()
    )
  );

-- Anyone can view seasonal pricing
CREATE POLICY "Anyone can view seasonal pricing" ON seasonal_pricing
  FOR SELECT USING (true);