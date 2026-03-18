-- Fix: RLS policies had circular dependency on profiles table
-- Subquery (SELECT org_id FROM profiles WHERE id = auth.uid()) inside profiles RLS
-- caused PostgreSQL to apply RLS recursively, returning 0 rows → 403 errors
--
-- Solution: SECURITY DEFINER functions bypass RLS for internal lookups

-- Helper: get current user's org_id (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_user_org_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT org_id FROM profiles WHERE id = auth.uid()
$$;

-- Helper: get current user's role (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text FROM profiles WHERE id = auth.uid()
$$;

-- ============================================================
-- Drop all affected policies
-- ============================================================
DROP POLICY IF EXISTS profiles_select ON profiles;
DROP POLICY IF EXISTS org_select ON organizations;
DROP POLICY IF EXISTS org_update ON organizations;
DROP POLICY IF EXISTS locations_select ON locations;
DROP POLICY IF EXISTS locations_manage ON locations;
DROP POLICY IF EXISTS location_access_select ON location_access;
DROP POLICY IF EXISTS location_access_manage ON location_access;
DROP POLICY IF EXISTS equipment_manage ON equipment;
DROP POLICY IF EXISTS templates_select ON checklist_templates;
DROP POLICY IF EXISTS templates_manage ON checklist_templates;

-- ============================================================
-- Recreate policies using helper functions
-- ============================================================

-- Profiles: own profile OR same org
CREATE POLICY profiles_select ON profiles
  FOR SELECT USING (
    id = auth.uid()
    OR org_id = public.get_user_org_id()
  );

-- Organizations: members can read their org
CREATE POLICY org_select ON organizations
  FOR SELECT USING (
    id = public.get_user_org_id()
  );

CREATE POLICY org_update ON organizations
  FOR UPDATE USING (
    id = public.get_user_org_id()
    AND public.get_user_role() IN ('owner', 'manager')
  );

-- Locations: org members can see their locations
CREATE POLICY locations_select ON locations
  FOR SELECT USING (
    org_id = public.get_user_org_id()
  );

CREATE POLICY locations_manage ON locations
  FOR ALL USING (
    org_id = public.get_user_org_id()
    AND public.get_user_role() IN ('owner', 'manager')
  );

-- Location access: org members can see access records
CREATE POLICY location_access_select ON location_access
  FOR SELECT USING (
    location_id IN (
      SELECT l.id FROM locations l
      WHERE l.org_id = public.get_user_org_id()
    )
  );

CREATE POLICY location_access_manage ON location_access
  FOR ALL USING (
    location_id IN (
      SELECT l.id FROM locations l
      WHERE l.org_id = public.get_user_org_id()
    )
    AND public.get_user_role() IN ('owner', 'manager')
  );

-- Equipment: manage requires role check
CREATE POLICY equipment_manage ON equipment
  FOR ALL USING (
    location_id IN (
      SELECT la.location_id FROM location_access la WHERE la.user_id = auth.uid()
    )
    AND public.get_user_role() IN ('owner', 'manager')
  );

-- Checklist templates: system visible to all, custom to org
CREATE POLICY templates_select ON checklist_templates
  FOR SELECT USING (
    is_system = TRUE
    OR org_id = public.get_user_org_id()
  );

CREATE POLICY templates_manage ON checklist_templates
  FOR ALL USING (
    org_id = public.get_user_org_id()
    AND is_system = FALSE
    AND public.get_user_role() IN ('owner', 'manager')
  );
