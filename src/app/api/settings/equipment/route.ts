import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { equipmentSchema } from '@/lib/validations/equipment';
import { apiError } from '@/lib/utils/api-error';

export async function GET() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data } = await supabase
    .from('equipment')
    .select('*')
    .eq('is_active', true)
    .order('position');

  return NextResponse.json(data || []);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const body = await request.json();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check role
  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id, role')
    .eq('id', user.id)
    .single();

  if (!profile || !['owner', 'manager'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const parsed = equipmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { name, equipmentType, minTemp, maxTemp } = parsed.data;

  // Get first location in org
  const { data: locations } = await supabase
    .from('locations')
    .select('id')
    .eq('org_id', profile.org_id!)
    .limit(1);

  if (!locations || locations.length === 0) {
    return NextResponse.json({ error: 'No location found' }, { status: 404 });
  }

  // Get max position
  const { data: existing } = await supabase
    .from('equipment')
    .select('position')
    .eq('location_id', locations[0].id)
    .order('position', { ascending: false })
    .limit(1);

  const nextPosition = existing && existing.length > 0 ? existing[0].position + 1 : 0;

  const { data, error } = await supabase
    .from('equipment')
    .insert({
      location_id: locations[0].id,
      name,
      equipment_type: equipmentType,
      min_temp: minTemp,
      max_temp: maxTemp,
      position: nextPosition,
    })
    .select()
    .single();

  if (error) {
    return apiError(error);
  }

  return NextResponse.json(data);
}
