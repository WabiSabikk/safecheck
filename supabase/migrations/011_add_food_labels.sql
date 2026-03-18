-- Food label templates and generated labels
CREATE TABLE IF NOT EXISTS food_label_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  food_name VARCHAR(255) NOT NULL,
  shelf_life_days INTEGER NOT NULL DEFAULT 3,
  allergens TEXT[] DEFAULT '{}',
  storage_instructions VARCHAR(500),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS food_labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  template_id UUID REFERENCES food_label_templates(id) ON DELETE SET NULL,
  food_name VARCHAR(255) NOT NULL,
  prep_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expiry_date DATE NOT NULL,
  allergens TEXT[] DEFAULT '{}',
  prepared_by UUID REFERENCES profiles(id),
  storage_instructions VARCHAR(500),
  quantity INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE food_label_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_labels ENABLE ROW LEVEL SECURITY;

CREATE POLICY flt_select ON food_label_templates FOR SELECT TO authenticated
  USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY flt_insert ON food_label_templates FOR INSERT TO authenticated
  WITH CHECK (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY flt_delete ON food_label_templates FOR DELETE TO authenticated
  USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('owner', 'manager'));

CREATE POLICY fl_select ON food_labels FOR SELECT TO authenticated
  USING (location_id IN (SELECT id FROM locations WHERE org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid())));
CREATE POLICY fl_insert ON food_labels FOR INSERT TO authenticated
  WITH CHECK (location_id IN (SELECT id FROM locations WHERE org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid())));

CREATE INDEX IF NOT EXISTS idx_fl_location ON food_labels(location_id);
CREATE INDEX IF NOT EXISTS idx_fl_expiry ON food_labels(expiry_date);
CREATE INDEX IF NOT EXISTS idx_flt_org ON food_label_templates(org_id);
