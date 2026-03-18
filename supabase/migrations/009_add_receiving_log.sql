-- Receiving Log for FDA Food Traceability Rule
CREATE TABLE IF NOT EXISTS receiving_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  supplier_name VARCHAR(255) NOT NULL,
  delivery_date DATE NOT NULL DEFAULT CURRENT_DATE,
  received_by UUID NOT NULL REFERENCES profiles(id),
  items JSONB NOT NULL DEFAULT '[]',
  -- Each item: { name, quantity, unit, temperature, tempUnit, inRange, isTCS, lotNumber }
  delivery_temp DECIMAL(5,1),
  delivery_temp_unit VARCHAR(1) DEFAULT 'F',
  notes TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE receiving_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY receiving_select ON receiving_logs
  FOR SELECT USING (
    location_id IN (SELECT l.id FROM locations l WHERE l.org_id = public.get_user_org_id())
  );

CREATE POLICY receiving_manage ON receiving_logs
  FOR ALL USING (
    location_id IN (SELECT l.id FROM locations l WHERE l.org_id = public.get_user_org_id())
  );

-- Index
CREATE INDEX idx_receiving_date ON receiving_logs(delivery_date DESC);
CREATE INDEX idx_receiving_location ON receiving_logs(location_id);
