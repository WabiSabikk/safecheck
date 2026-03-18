import { NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/admin/check-admin';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { sanitizePostgrestSearch } from '@/lib/utils/sanitize';

export async function GET(request: Request) {
  const auth = await checkAdmin();
  if (!auth.authorized) return auth.response;

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const tier = searchParams.get('tier') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = 25;
  const offset = (page - 1) * limit;

  let query = supabaseAdmin
    .from('organizations')
    .select('*', { count: 'exact' });

  if (search) {
    const safe = sanitizePostgrestSearch(search);
    query = query.ilike('name', `%${safe}%`);
  }
  if (tier) {
    query = query.eq('subscription_tier', tier);
  }

  const { data: orgs, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  // Get counts for each org
  const enriched = [];
  for (const org of orgs || []) {
    const { count: userCount } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', org.id);

    const { count: locationCount } = await supabaseAdmin
      .from('locations')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', org.id);

    enriched.push({
      id: org.id,
      name: org.name,
      subscription_tier: org.subscription_tier,
      stripe_subscription_status: org.stripe_subscription_status,
      user_count: userCount || 0,
      location_count: locationCount || 0,
      created_at: org.created_at,
    });
  }

  return NextResponse.json({
    organizations: enriched,
    total: count || 0,
    page,
    limit,
  });
}
