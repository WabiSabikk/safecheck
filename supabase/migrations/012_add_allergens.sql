-- Menu item allergen tracking (FDA Big 9 + custom)
CREATE TABLE IF NOT EXISTS menu_allergens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  item_name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  allergens TEXT[] DEFAULT '{}',
  cross_contact_risk TEXT[] DEFAULT '{}',
  storage_notes VARCHAR(500),
  separate_storage BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE menu_allergens ENABLE ROW LEVEL SECURITY;

CREATE POLICY ma_select ON menu_allergens FOR SELECT TO authenticated
  USING (location_id IN (SELECT id FROM locations WHERE org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid())));
CREATE POLICY ma_insert ON menu_allergens FOR INSERT TO authenticated
  WITH CHECK (location_id IN (SELECT id FROM locations WHERE org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid())));
CREATE POLICY ma_update ON menu_allergens FOR UPDATE TO authenticated
  USING (location_id IN (SELECT id FROM locations WHERE org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid())));
CREATE POLICY ma_delete ON menu_allergens FOR DELETE TO authenticated
  USING (location_id IN (SELECT id FROM locations WHERE org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()))
    AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('owner', 'manager'));

CREATE INDEX IF NOT EXISTS idx_ma_location ON menu_allergens(location_id);
CREATE INDEX IF NOT EXISTS idx_ma_allergens ON menu_allergens USING GIN(allergens);
