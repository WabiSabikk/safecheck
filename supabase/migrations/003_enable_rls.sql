-- Enable Row Level Security on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE temperature_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE corrective_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Profile: users can read/update their own profile
CREATE POLICY profiles_select ON profiles
  FOR SELECT USING (
    org_id = (SELECT org_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY profiles_update_own ON profiles
  FOR UPDATE USING (id = auth.uid());

-- Organizations: members can read their org
CREATE POLICY org_select ON organizations
  FOR SELECT USING (
    id = (SELECT org_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY org_update ON organizations
  FOR UPDATE USING (
    id = (SELECT org_id FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('owner', 'manager')
  );

-- Locations: org members can see their locations
CREATE POLICY locations_select ON locations
  FOR SELECT USING (
    org_id = (SELECT org_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY locations_manage ON locations
  FOR ALL USING (
    org_id = (SELECT org_id FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('owner', 'manager')
  );

-- Location access: org members can see access records
CREATE POLICY location_access_select ON location_access
  FOR SELECT USING (
    location_id IN (
      SELECT l.id FROM locations l
      WHERE l.org_id = (SELECT org_id FROM profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY location_access_manage ON location_access
  FOR ALL USING (
    location_id IN (
      SELECT l.id FROM locations l
      WHERE l.org_id = (SELECT org_id FROM profiles WHERE id = auth.uid())
    )
    AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('owner', 'manager')
  );

-- Equipment: visible to users with location access
CREATE POLICY equipment_select ON equipment
  FOR SELECT USING (
    location_id IN (
      SELECT la.location_id FROM location_access la WHERE la.user_id = auth.uid()
    )
  );

CREATE POLICY equipment_manage ON equipment
  FOR ALL USING (
    location_id IN (
      SELECT la.location_id FROM location_access la WHERE la.user_id = auth.uid()
    )
    AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('owner', 'manager')
  );

-- Checklist templates: system templates visible to all, custom to org
CREATE POLICY templates_select ON checklist_templates
  FOR SELECT USING (
    is_system = TRUE
    OR org_id = (SELECT org_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY templates_manage ON checklist_templates
  FOR ALL USING (
    org_id = (SELECT org_id FROM profiles WHERE id = auth.uid())
    AND is_system = FALSE
    AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('owner', 'manager')
  );

-- Checklist submissions: location-scoped
CREATE POLICY submissions_select ON checklist_submissions
  FOR SELECT USING (
    location_id IN (
      SELECT la.location_id FROM location_access la WHERE la.user_id = auth.uid()
    )
  );

CREATE POLICY submissions_insert ON checklist_submissions
  FOR INSERT WITH CHECK (
    location_id IN (
      SELECT la.location_id FROM location_access la WHERE la.user_id = auth.uid()
    )
  );

CREATE POLICY submissions_update ON checklist_submissions
  FOR UPDATE USING (
    location_id IN (
      SELECT la.location_id FROM location_access la WHERE la.user_id = auth.uid()
    )
  );

-- Temperature logs: location-scoped
CREATE POLICY temp_logs_select ON temperature_logs
  FOR SELECT USING (
    location_id IN (
      SELECT la.location_id FROM location_access la WHERE la.user_id = auth.uid()
    )
  );

CREATE POLICY temp_logs_insert ON temperature_logs
  FOR INSERT WITH CHECK (
    location_id IN (
      SELECT la.location_id FROM location_access la WHERE la.user_id = auth.uid()
    )
  );

-- Corrective actions: location-scoped
CREATE POLICY corrective_select ON corrective_actions
  FOR SELECT USING (
    location_id IN (
      SELECT la.location_id FROM location_access la WHERE la.user_id = auth.uid()
    )
  );

CREATE POLICY corrective_insert ON corrective_actions
  FOR INSERT WITH CHECK (
    location_id IN (
      SELECT la.location_id FROM location_access la WHERE la.user_id = auth.uid()
    )
  );

-- Notification preferences: own only
CREATE POLICY notif_prefs_own ON notification_preferences
  FOR ALL USING (user_id = auth.uid());
