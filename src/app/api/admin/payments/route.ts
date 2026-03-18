import { NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/admin/check-admin';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET() {
  const auth = await checkAdmin();
  if (!auth.authorized) return auth.response;

  const { data: orgs } = await supabaseAdmin
    .from('organizations')
    .select('id, name, subscription_tier, stripe_customer_id, stripe_subscription_id, stripe_subscription_status, stripe_current_period_end')
    .order('created_at', { ascending: false });

  const payments = (orgs || []).map(o => ({
    org_id: o.id,
    org_name: o.name,
    subscription_tier: o.subscription_tier,
    stripe_customer_id: o.stripe_customer_id,
    stripe_subscription_id: o.stripe_subscription_id,
    stripe_subscription_status: o.stripe_subscription_status,
    stripe_current_period_end: o.stripe_current_period_end,
  }));

  // Summary stats
  const free = payments.filter(p => p.subscription_tier === 'free').length;
  const starter = payments.filter(p => p.subscription_tier === 'starter').length;
  const professional = payments.filter(p => p.subscription_tier === 'professional').length;
  const mrr = starter * 19 + professional * 39;

  return NextResponse.json({
    payments,
    summary: { free, starter, professional, mrr },
  });
}
