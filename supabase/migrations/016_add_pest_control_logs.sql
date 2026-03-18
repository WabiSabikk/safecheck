-- Pest Control Log for tracking pest control activities
CREATE TABLE IF NOT EXISTS pest_control_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES profiles(id),
  service_date DATE NOT NULL,
  provider_name VARCHAR(255) NOT NULL,
  areas_treated TEXT[] NOT NULL DEFAULT '{}',
  treatment_type VARCHAR(100) NOT NULL,
  findings TEXT,
  next_service_date DATE,
  report_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE pest_control_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY pest_control_select ON pest_control_logs
  FOR SELECT USING (org_id = public.get_user_org_id());

CREATE POLICY pest_control_manage ON pest_control_logs
  FOR ALL USING (
    org_id = public.get_user_org_id()
    AND public.get_user_role() IN ('owner', 'manager')
  );

-- Indexes
CREATE INDEX idx_pest_control_org ON pest_control_logs(org_id);
CREATE INDEX idx_pest_control_date ON pest_control_logs(service_date DESC);
