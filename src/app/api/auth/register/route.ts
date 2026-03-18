import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { registerSchema } from '@/lib/validations/auth';
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/utils/rate-limit';

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is required');
}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export async function POST(request: Request) {
  // Rate limit registration
  const ip = getClientIp(request);
  const rl = checkRateLimit(`register:${ip}`, RATE_LIMITS.auth);
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Too many attempts. Try again later.' },
      { status: 429 }
    );
  }

  const body = await request.json();

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const { email, password, displayName, restaurantName } = parsed.data;

  // 1. Create auth user
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      display_name: displayName,
      role: 'owner',
    },
  });

  if (authError) {
    console.error('[Register] Auth error:', authError.message);
    return NextResponse.json(
      { error: 'Registration failed. Please try again.' },
      { status: 400 }
    );
  }

  const userId = authData.user.id;

  // 2. Create organization
  const { data: org, error: orgError } = await supabaseAdmin
    .from('organizations')
    .insert({ name: restaurantName })
    .select()
    .single();

  if (orgError) {
    return NextResponse.json(
      { error: 'Failed to create organization' },
      { status: 500 }
    );
  }

  // 3. Create default location
  const { data: location, error: locError } = await supabaseAdmin
    .from('locations')
    .insert({
      org_id: org.id,
      name: restaurantName,
    })
    .select()
    .single();

  if (locError) {
    return NextResponse.json(
      { error: 'Failed to create location' },
      { status: 500 }
    );
  }

  // 4. Create profile (no trigger — we do it manually)
  await supabaseAdmin
    .from('profiles')
    .insert({
      id: userId,
      email,
      display_name: displayName,
      role: 'owner',
      org_id: org.id,
    });

  // 5. Grant location access
  await supabaseAdmin
    .from('location_access')
    .insert({
      user_id: userId,
      location_id: location.id,
    });

  // 6. Seed default equipment for the location
  await supabaseAdmin
    .from('equipment')
    .insert([
      { location_id: location.id, name: 'Walk-in Cooler', equipment_type: 'cold_storage', min_temp: 32.0, max_temp: 41.0, position: 0 },
      { location_id: location.id, name: 'Reach-in Fridge', equipment_type: 'cold_storage', min_temp: 32.0, max_temp: 41.0, position: 1 },
      { location_id: location.id, name: 'Freezer', equipment_type: 'freezer', min_temp: -10.0, max_temp: 0.0, position: 2 },
      { location_id: location.id, name: 'Hot Holding Station', equipment_type: 'hot_holding', min_temp: 135.0, max_temp: 200.0, position: 3 },
    ]);

  // 7. Create today's checklist submissions from system templates
  const { data: templates } = await supabaseAdmin
    .from('checklist_templates')
    .select('id')
    .eq('is_system', true);

  if (templates) {
    const today = new Date().toISOString().split('T')[0];
    await supabaseAdmin
      .from('checklist_submissions')
      .insert(
        templates.map(t => ({
          location_id: location.id,
          template_id: t.id,
          scheduled_date: today,
        }))
      );
  }

  return NextResponse.json({ success: true });
}
