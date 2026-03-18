-- Indexes for performance
CREATE INDEX idx_locations_org ON locations(org_id);
CREATE INDEX idx_profiles_org ON profiles(org_id);
CREATE INDEX idx_equipment_location ON equipment(location_id) WHERE is_active = TRUE;
CREATE INDEX idx_checklist_subs_location_date ON checklist_submissions(location_id, scheduled_date DESC);
CREATE INDEX idx_checklist_subs_status ON checklist_submissions(status) WHERE status != 'completed';
CREATE INDEX idx_temp_logs_location_date ON temperature_logs(location_id, logged_at DESC);
CREATE INDEX idx_temp_logs_out_of_range ON temperature_logs(location_id, logged_at DESC) WHERE is_in_range = FALSE;
CREATE INDEX idx_corrective_actions_location ON corrective_actions(location_id, logged_at DESC);
