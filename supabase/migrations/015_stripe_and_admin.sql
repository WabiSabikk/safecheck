-- Migration 015: Stripe subscription fields + Admin users table
-- Date: 2026-02-19

-- ============================================
-- 1. Add Stripe subscription tracking to organizations
-- ============================================

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS stripe_subscription_status VARCHAR(50),
  ADD COLUMN IF NOT EXISTS stripe_current_period_end TIMESTAMPTZ;

-- Indexes for webhook lookups
CREATE INDEX IF NOT EXISTS idx_organizations_stripe_customer
  ON organizations(stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_organizations_stripe_subscription
  ON organizations(stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;

-- ============================================
-- 2. Admin users table (platform-level)
-- ============================================

CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- RLS: admin table is NOT accessible via anon/authenticated clients
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
-- No policies = no access through anon/authenticated, only SERVICE_ROLE_KEY

CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON admin_users(user_id);

-- ============================================
-- 3. Function to set admin custom claim in JWT
-- ============================================

CREATE OR REPLACE FUNCTION set_admin_claim(target_user_id UUID, make_admin BOOLEAN)
RETURNS VOID AS $$
BEGIN
  UPDATE auth.users
  SET raw_app_meta_data =
    CASE
      WHEN make_admin THEN COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"is_admin": true}'::jsonb
      ELSE COALESCE(raw_app_meta_data, '{}'::jsonb) - 'is_admin'
    END
  WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: on insert → set admin claim
CREATE OR REPLACE FUNCTION on_admin_user_insert()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM set_admin_claim(NEW.user_id, TRUE);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_admin_user_insert ON admin_users;
CREATE TRIGGER tr_admin_user_insert
  AFTER INSERT ON admin_users
  FOR EACH ROW EXECUTE FUNCTION on_admin_user_insert();

-- Trigger: on delete → remove admin claim
CREATE OR REPLACE FUNCTION on_admin_user_delete()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM set_admin_claim(OLD.user_id, FALSE);
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_admin_user_delete ON admin_users;
CREATE TRIGGER tr_admin_user_delete
  AFTER DELETE ON admin_users
  FOR EACH ROW EXECUTE FUNCTION on_admin_user_delete();
