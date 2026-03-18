export type UserRole = 'owner' | 'manager' | 'staff';
export type EquipmentType = 'cold_storage' | 'hot_holding' | 'freezer';
export type ChecklistType = 'opening' | 'closing' | 'mid_shift' | 'custom';
export type SubmissionStatus = 'pending' | 'in_progress' | 'completed' | 'overdue';
export type SubscriptionTier = 'free' | 'starter' | 'professional';
export type IssueType = 'high_temp' | 'low_temp' | 'equipment_malfunction' | 'food_discarded' | 'other';

export interface Organization {
  id: string;
  name: string;
  subscription_tier: SubscriptionTier;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_subscription_status: string | null;
  stripe_current_period_end: string | null;
  created_at: string;
  updated_at: string;
}

export interface Location {
  id: string;
  org_id: string;
  name: string;
  address: string | null;
  license_number: string | null;
  restaurant_type: string;
  timezone: string;
  operating_hours: { open: string; close: string; days_off: number[] };
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  email: string | null;
  display_name: string;
  role: UserRole;
  pin_hash: string | null;
  pin_attempts: number;
  pin_locked_until: string | null;
  preferred_language: string;
  org_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Equipment {
  id: string;
  location_id: string;
  name: string;
  equipment_type: EquipmentType;
  min_temp: number | null;
  max_temp: number | null;
  position: number;
  is_active: boolean;
  created_at: string;
}

export interface ChecklistTemplate {
  id: string;
  org_id: string | null;
  name: string;
  checklist_type: ChecklistType;
  restaurant_type: string | null;
  is_system: boolean;
  scheduled_time: string | null;
  overdue_after_minutes: number;
  items: ChecklistItem[];
  created_at: string;
  updated_at: string;
}

export interface ChecklistItem {
  id: string;
  category: string;
  description: string;
  is_required: boolean;
  position: number;
}

export interface ChecklistSubmission {
  id: string;
  location_id: string;
  template_id: string;
  scheduled_date: string;
  status: SubmissionStatus;
  started_at: string | null;
  completed_at: string | null;
  completed_by: string | null;
  responses: Record<string, ChecklistItemResponse>;
  created_at: string;
  updated_at: string;
  // joined
  template?: ChecklistTemplate;
}

export interface ChecklistItemResponse {
  completed: boolean;
  completed_at: string | null;
  completed_by: string | null;
  note: string | null;
}

export interface TemperatureLog {
  id: string;
  location_id: string;
  equipment_id: string;
  temperature: number;
  unit: 'F' | 'C';
  is_in_range: boolean;
  min_temp_snapshot: number | null;
  max_temp_snapshot: number | null;
  logged_at: string;
  logged_by: string;
  notes: string | null;
  device_id: string | null;
  photo_url: string | null;
  created_at: string;
  // joined
  equipment?: Equipment;
  profile?: Profile;
}

export interface CorrectiveAction {
  id: string;
  location_id: string;
  temperature_log_id: string | null;
  issue_type: IssueType;
  description: string;
  action_taken: string;
  logged_at: string;
  logged_by: string;
  is_resolved: boolean;
  resolved_at: string | null;
  photo_url: string | null;
  created_at: string;
}

export type TreatmentType = 'spray' | 'bait_stations' | 'traps' | 'fumigation';
export type PestControlArea = 'kitchen' | 'storage' | 'dining' | 'restroom' | 'exterior';

export interface PestControlLog {
  id: string;
  org_id: string;
  created_by: string;
  service_date: string;
  provider_name: string;
  areas_treated: PestControlArea[];
  treatment_type: string;
  findings: string | null;
  next_service_date: string | null;
  report_notes: string | null;
  created_at: string;
  updated_at: string;
  // joined
  profile?: { display_name: string };
}

export type SupplierStatus = 'approved' | 'pending' | 'suspended';
export type VerificationMethod = 'site_visit' | 'documentation_review' | 'third_party_audit';

export interface Supplier {
  id: string;
  org_id: string;
  supplier_name: string;
  contact_phone: string | null;
  contact_email: string | null;
  products: string | null;
  last_verification_date: string | null;
  verification_method: string | null;
  license_number: string | null;
  status: SupplierStatus;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  // joined
  profile?: { display_name: string };
}
