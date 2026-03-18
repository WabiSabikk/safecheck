-- Notification preferences per user
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  email_temp_alerts BOOLEAN DEFAULT TRUE,
  email_checklist_reminders BOOLEAN DEFAULT TRUE,
  email_weekly_digest BOOLEAN DEFAULT TRUE,
  push_temp_alerts BOOLEAN DEFAULT TRUE,
  push_checklist_reminders BOOLEAN DEFAULT TRUE,
  push_subscription JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alert log for tracking sent notifications
CREATE TABLE IF NOT EXISTS alert_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
  alert_type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT,
  recipient_id UUID REFERENCES profiles(id),
  channel VARCHAR(20) NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY np_select ON notification_preferences FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY np_upsert ON notification_preferences FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY np_update ON notification_preferences FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY al_select ON alert_log FOR SELECT TO authenticated
  USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY al_insert ON alert_log FOR INSERT TO authenticated
  WITH CHECK (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_al_org ON alert_log(org_id);
CREATE INDEX IF NOT EXISTS idx_al_sent ON alert_log(sent_at);
