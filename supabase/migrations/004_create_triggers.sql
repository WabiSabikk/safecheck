-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_organizations_updated BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_locations_updated BEFORE UPDATE ON locations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_profiles_updated BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_checklist_templates_updated BEFORE UPDATE ON checklist_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_checklist_subs_updated BEFORE UPDATE ON checklist_submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, display_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'owner')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Compute is_in_range for temperature logs
CREATE OR REPLACE FUNCTION compute_temp_in_range()
RETURNS TRIGGER AS $$
BEGIN
  -- Snapshot equipment thresholds
  SELECT min_temp, max_temp INTO NEW.min_temp_snapshot, NEW.max_temp_snapshot
  FROM equipment WHERE id = NEW.equipment_id;

  -- Compute is_in_range
  IF NEW.min_temp_snapshot IS NOT NULL AND NEW.max_temp_snapshot IS NOT NULL THEN
    NEW.is_in_range = NEW.temperature >= NEW.min_temp_snapshot AND NEW.temperature <= NEW.max_temp_snapshot;
  ELSE
    NEW.is_in_range = TRUE;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_temp_log_range BEFORE INSERT ON temperature_logs
  FOR EACH ROW EXECUTE FUNCTION compute_temp_in_range();
