export interface AdminStats {
  totalOrgs: number;
  totalUsers: number;
  activeUsers7d: number;
  mrr: number;
  tierDistribution: { tier: string; count: number }[];
  signupsOverTime: { date: string; count: number }[];
  recentSignups: { id: string; email: string; display_name: string; created_at: string; org_name: string }[];
}

export interface AdminUser {
  id: string;
  email: string | null;
  display_name: string;
  role: string;
  org_id: string | null;
  org_name: string | null;
  subscription_tier: string | null;
  created_at: string;
  last_sign_in_at: string | null;
}

export interface AdminOrg {
  id: string;
  name: string;
  subscription_tier: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_subscription_status: string | null;
  user_count: number;
  location_count: number;
  created_at: string;
}

export interface AdminPayment {
  org_id: string;
  org_name: string;
  subscription_tier: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_subscription_status: string | null;
  stripe_current_period_end: string | null;
}

export interface SystemHealth {
  tables: { name: string; count: number }[];
}
