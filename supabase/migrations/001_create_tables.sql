-- SafeCheck Database Schema
-- Migration 001: Create all tables

-- Enums
CREATE TYPE user_role AS ENUM ('owner', 'manager', 'staff');
CREATE TYPE equipment_type AS ENUM ('cold_storage', 'hot_holding', 'freezer');
CREATE TYPE checklist_type AS ENUM ('opening', 'closing', 'mid_shift', 'custom');
CREATE TYPE submission_status AS ENUM ('pending', 'in_progress', 'completed', 'overdue');
CREATE TYPE subscription_tier AS ENUM ('free', 'starter', 'professional');
CREATE TYPE issue_type AS ENUM ('high_temp', 'low_temp', 'equipment_malfunction', 'food_discarded', 'other');

-- Organizations (multi-tenant root)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  subscription_tier subscription_tier DEFAULT 'free',
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Locations (restaurants)
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  license_number VARCHAR(100),
  restaurant_type VARCHAR(50) DEFAULT 'full_service',
  timezone VARCHAR(50) DEFAULT 'America/New_York',
  operating_hours JSONB DEFAULT '{"open": "06:00", "close": "23:00", "days_off": []}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255),
  display_name VARCHAR(100) NOT NULL,
  role user_role DEFAULT 'staff',
  pin_hash VARCHAR(255),
  pin_attempts INTEGER DEFAULT 0,
  pin_locked_until TIMESTAMPTZ,
  preferred_language VARCHAR(5) DEFAULT 'en',
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Location access (which user can access which location)
CREATE TABLE location_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, location_id)
);

-- Equipment (fridges, freezers, hot hold stations)
CREATE TABLE equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  equipment_type equipment_type NOT NULL,
  min_temp DECIMAL(5,1),
  max_temp DECIMAL(5,1),
  position INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Checklist Templates
CREATE TABLE checklist_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  checklist_type checklist_type NOT NULL,
  restaurant_type VARCHAR(50),
  is_system BOOLEAN DEFAULT FALSE,
  scheduled_time TIME,
  overdue_after_minutes INTEGER DEFAULT 180,
  items JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Checklist Submissions (daily instances)
CREATE TABLE checklist_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES checklist_templates(id),
  scheduled_date DATE NOT NULL,
  status submission_status DEFAULT 'pending',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES profiles(id),
  responses JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(location_id, template_id, scheduled_date)
);

-- Temperature Logs
CREATE TABLE temperature_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  equipment_id UUID NOT NULL REFERENCES equipment(id),
  temperature DECIMAL(5,1) NOT NULL,
  unit VARCHAR(1) DEFAULT 'F' CHECK (unit IN ('F', 'C')),
  is_in_range BOOLEAN DEFAULT TRUE,
  min_temp_snapshot DECIMAL(5,1),
  max_temp_snapshot DECIMAL(5,1),
  logged_at TIMESTAMPTZ DEFAULT NOW(),
  logged_by UUID NOT NULL REFERENCES profiles(id),
  notes TEXT,
  device_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Corrective Actions
CREATE TABLE corrective_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  temperature_log_id UUID REFERENCES temperature_logs(id),
  issue_type issue_type NOT NULL,
  description TEXT NOT NULL,
  action_taken TEXT NOT NULL,
  logged_at TIMESTAMPTZ DEFAULT NOW(),
  logged_by UUID NOT NULL REFERENCES profiles(id),
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification Preferences
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  temp_alert_email BOOLEAN DEFAULT TRUE,
  temp_alert_push BOOLEAN DEFAULT TRUE,
  daily_digest BOOLEAN DEFAULT TRUE,
  weekly_summary BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);
