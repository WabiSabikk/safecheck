-- Certification tracking for staff (ServSafe, CFP, etc.)
-- Note: is_expired and expires_soon computed on client (GENERATED ALWAYS not allowed with CURRENT_DATE)
CREATE TABLE IF NOT EXISTS certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  cert_type VARCHAR(100) NOT NULL,
  cert_name VARCHAR(255) NOT NULL,
  issued_date DATE,
  expiry_date DATE,
  cert_number VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY cert_select ON certifications
  FOR SELECT USING (org_id = public.get_user_org_id());

CREATE POLICY cert_manage ON certifications
  FOR ALL USING (
    org_id = public.get_user_org_id()
    AND public.get_user_role() IN ('owner', 'manager')
  );

CREATE INDEX IF NOT EXISTS idx_cert_expiry ON certifications(expiry_date);
CREATE INDEX IF NOT EXISTS idx_cert_user ON certifications(user_id);
