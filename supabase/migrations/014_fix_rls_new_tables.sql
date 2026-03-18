-- Fix: RLS policies in migrations 011, 012, 013 use direct subquery on profiles table
-- which causes the same circular dependency fixed in 006 for other tables.
-- Replace with SECURITY DEFINER helper function public.get_user_org_id()

-- ============================================================
-- Food Label Templates — fix RLS
-- ============================================================
DROP POLICY IF EXISTS flt_select ON food_label_templates;
DROP POLICY IF EXISTS flt_insert ON food_label_templates;
DROP POLICY IF EXISTS flt_delete ON food_label_templates;

CREATE POLICY flt_select ON food_label_templates FOR SELECT TO authenticated
  USING (org_id = public.get_user_org_id());
CREATE POLICY flt_insert ON food_label_templates FOR INSERT TO authenticated
  WITH CHECK (org_id = public.get_user_org_id());
CREATE POLICY flt_delete ON food_label_templates FOR DELETE TO authenticated
  USING (org_id = public.get_user_org_id()
    AND public.get_user_role() IN ('owner', 'manager'));

-- ============================================================
-- Food Labels — fix RLS
-- ============================================================
DROP POLICY IF EXISTS fl_select ON food_labels;
DROP POLICY IF EXISTS fl_insert ON food_labels;

CREATE POLICY fl_select ON food_labels FOR SELECT TO authenticated
  USING (location_id IN (
    SELECT l.id FROM locations l WHERE l.org_id = public.get_user_org_id()
  ));
CREATE POLICY fl_insert ON food_labels FOR INSERT TO authenticated
  WITH CHECK (location_id IN (
    SELECT l.id FROM locations l WHERE l.org_id = public.get_user_org_id()
  ));

-- ============================================================
-- Menu Allergens — fix RLS
-- ============================================================
DROP POLICY IF EXISTS ma_select ON menu_allergens;
DROP POLICY IF EXISTS ma_insert ON menu_allergens;
DROP POLICY IF EXISTS ma_update ON menu_allergens;
DROP POLICY IF EXISTS ma_delete ON menu_allergens;

CREATE POLICY ma_select ON menu_allergens FOR SELECT TO authenticated
  USING (location_id IN (
    SELECT l.id FROM locations l WHERE l.org_id = public.get_user_org_id()
  ));
CREATE POLICY ma_insert ON menu_allergens FOR INSERT TO authenticated
  WITH CHECK (location_id IN (
    SELECT l.id FROM locations l WHERE l.org_id = public.get_user_org_id()
  ));
CREATE POLICY ma_update ON menu_allergens FOR UPDATE TO authenticated
  USING (location_id IN (
    SELECT l.id FROM locations l WHERE l.org_id = public.get_user_org_id()
  ));
CREATE POLICY ma_delete ON menu_allergens FOR DELETE TO authenticated
  USING (location_id IN (
    SELECT l.id FROM locations l WHERE l.org_id = public.get_user_org_id()
  ) AND public.get_user_role() IN ('owner', 'manager'));

-- ============================================================
-- Alert Log — fix RLS
-- ============================================================
DROP POLICY IF EXISTS al_select ON alert_log;
DROP POLICY IF EXISTS al_insert ON alert_log;

CREATE POLICY al_select ON alert_log FOR SELECT TO authenticated
  USING (org_id = public.get_user_org_id());
CREATE POLICY al_insert ON alert_log FOR INSERT TO authenticated
  WITH CHECK (org_id = public.get_user_org_id());
