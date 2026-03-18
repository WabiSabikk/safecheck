import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';
import bcrypt from 'bcryptjs';
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/utils/rate-limit';

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is required');
}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export async function GET() {
  const supabase = await createServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id, role')
    .eq('id', user.id)
    .single();

  if (!profile || !['owner', 'manager'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data: members } = await supabase
    .from('profiles')
    .select('id, display_name, email, role, created_at')
    .eq('org_id', profile.org_id!)
    .order('created_at');

  return NextResponse.json(members || []);
}

export async function POST(request: Request) {
  // Rate limit
  const ip = getClientIp(request);
  const rl = checkRateLimit(`team:${ip}`, RATE_LIMITS.api);
  if (!rl.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const supabase = await createServerClient();
  const body = await request.json();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id, role')
    .eq('id', user.id)
    .single();

  if (!profile || !['owner', 'manager'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const displayName = typeof body.displayName === 'string' ? body.displayName.trim() : '';
  const pin = typeof body.pin === 'string' ? body.pin : '';

  if (!displayName || displayName.length < 2 || displayName.length > 100) {
    return NextResponse.json({ error: 'Name must be 2-100 characters' }, { status: 400 });
  }

  if (!/^\d{4}$/.test(pin)) {
    return NextResponse.json({ error: '4-digit numeric PIN required' }, { status: 400 });
  }

  // Create a dummy auth user for staff (they only use PIN)
  const dummyEmail = `staff-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@safecheck.internal`;
  const randomPassword = `${crypto.randomUUID()}-${Date.now()}`;
  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: dummyEmail,
    password: randomPassword,
    email_confirm: true,
    user_metadata: {
      display_name: displayName,
      role: 'staff',
    },
  });

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 500 });
  }

  // Hash PIN
  const pinHash = await bcrypt.hash(pin, 10);

  // Update profile
  await supabaseAdmin
    .from('profiles')
    .update({
      display_name: displayName,
      role: 'staff',
      pin_hash: pinHash,
      org_id: profile.org_id,
    })
    .eq('id', authUser.user.id);

  // Grant access to all locations in the org
  const { data: locations } = await supabaseAdmin
    .from('locations')
    .select('id')
    .eq('org_id', profile.org_id!);

  if (locations) {
    await supabaseAdmin
      .from('location_access')
      .insert(
        locations.map(loc => ({
          user_id: authUser.user.id,
          location_id: loc.id,
        }))
      );
  }

  return NextResponse.json({ success: true, userId: authUser.user.id });
}
