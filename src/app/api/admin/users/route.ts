import { NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/admin/check-admin';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { sanitizePostgrestSearch } from '@/lib/utils/sanitize';

export async function GET(request: Request) {
  const auth = await checkAdmin();
  if (!auth.authorized) return auth.response;

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const role = searchParams.get('role') || '';
  const tier = searchParams.get('tier') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = 25;
  const offset = (page - 1) * limit;

  // Build query
  let query = supabaseAdmin
    .from('profiles')
    .select('id, email, display_name, role, org_id, created_at', { count: 'exact' });

  if (search) {
    const safe = sanitizePostgrestSearch(search);
    query = query.or(`email.ilike.%${safe}%,display_name.ilike.%${safe}%`);
  }
  if (role) {
    query = query.eq('role', role);
  }

  const { data: profiles, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  // Get auth data for last_sign_in
  const { data: authData } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
  const authMap = new Map(authData?.users?.map(u => [u.id, u.last_sign_in_at]) ?? []);

  // Get org names and tiers
  const orgIds = [...new Set((profiles || []).map(p => p.org_id).filter(Boolean))];
  const { data: orgs } = orgIds.length
    ? await supabaseAdmin
        .from('organizations')
        .select('id, name, subscription_tier')
        .in('id', orgIds)
    : { data: [] };
  const orgMap = new Map(orgs?.map(o => [o.id, o]) ?? []);

  const users = (profiles || []).map(p => {
    const org = p.org_id ? orgMap.get(p.org_id) : null;
    return {
      id: p.id,
      email: p.email,
      display_name: p.display_name,
      role: p.role,
      org_id: p.org_id,
      org_name: org?.name || null,
      subscription_tier: org?.subscription_tier || null,
      created_at: p.created_at,
      last_sign_in_at: authMap.get(p.id) || null,
    };
  });

  // Filter by tier if needed (post-filter since it's a join)
  const filtered = tier ? users.filter(u => u.subscription_tier === tier) : users;

  return NextResponse.json({
    users: filtered,
    total: count || 0,
    page,
    limit,
  });
}
