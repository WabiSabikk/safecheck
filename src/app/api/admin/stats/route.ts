import { NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/admin/check-admin';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { TIER_PRICES } from '@/lib/stripe/config';

export async function GET() {
  const auth = await checkAdmin();
  if (!auth.authorized) return auth.response;

  // Total orgs
  const { count: totalOrgs } = await supabaseAdmin
    .from('organizations')
    .select('*', { count: 'exact', head: true });

  // Total users (with email = real users, not PIN-only staff)
  const { count: totalUsers } = await supabaseAdmin
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  // Active users (last 7 days) via auth admin API
  const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const activeUsers7d = authUsers?.users?.filter(
    u => u.last_sign_in_at && new Date(u.last_sign_in_at) > sevenDaysAgo
  ).length ?? 0;

  // Tier distribution
  const { data: tiers } = await supabaseAdmin
    .from('organizations')
    .select('subscription_tier');

  const tierCounts: Record<string, number> = {};
  tiers?.forEach(t => {
    const tier = t.subscription_tier || 'free';
    tierCounts[tier] = (tierCounts[tier] || 0) + 1;
  });
  const tierDistribution = Object.entries(tierCounts).map(([tier, count]) => ({ tier, count }));

  // MRR calculation
  const mrr = (tierCounts['starter'] || 0) * TIER_PRICES.starter.monthly
    + (tierCounts['professional'] || 0) * TIER_PRICES.professional.monthly;

  // Signups over time (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data: recentOrgs } = await supabaseAdmin
    .from('organizations')
    .select('created_at')
    .gte('created_at', thirtyDaysAgo)
    .order('created_at');

  const signupsByDate: Record<string, number> = {};
  recentOrgs?.forEach(o => {
    const date = o.created_at.split('T')[0];
    signupsByDate[date] = (signupsByDate[date] || 0) + 1;
  });
  const signupsOverTime = Object.entries(signupsByDate).map(([date, count]) => ({ date, count }));

  // Recent signups (last 10)
  const { data: recentProfiles } = await supabaseAdmin
    .from('profiles')
    .select('id, email, display_name, created_at, org_id')
    .not('email', 'is', null)
    .order('created_at', { ascending: false })
    .limit(10);

  const recentSignups = [];
  for (const p of recentProfiles || []) {
    let orgName = '';
    if (p.org_id) {
      const { data: org } = await supabaseAdmin
        .from('organizations')
        .select('name')
        .eq('id', p.org_id)
        .single();
      orgName = org?.name || '';
    }
    recentSignups.push({
      id: p.id,
      email: p.email || '',
      display_name: p.display_name,
      created_at: p.created_at,
      org_name: orgName,
    });
  }

  return NextResponse.json({
    totalOrgs: totalOrgs || 0,
    totalUsers: totalUsers || 0,
    activeUsers7d,
    mrr,
    tierDistribution,
    signupsOverTime,
    recentSignups,
  });
}
