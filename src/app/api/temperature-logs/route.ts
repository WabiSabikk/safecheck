import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { temperatureLogSchema } from '@/lib/validations/temperature';
import { apiError } from '@/lib/utils/api-error';

export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const locationId = searchParams.get('locationId');
  const start = searchParams.get('start');
  const end = searchParams.get('end');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let query = supabase
    .from('temperature_logs')
    .select('*, equipment(*), profile:profiles!logged_by(display_name)')
    .order('logged_at', { ascending: false })
    .limit(100);

  if (locationId) query = query.eq('location_id', locationId);
  if (start) query = query.gte('logged_at', start);
  if (end) query = query.lte('logged_at', end);

  const { data, error } = await query;

  if (error) {
    return apiError(error);
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const body = await request.json();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsed = temperatureLogSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  // Get user's profile to find location
  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('id', user.id)
    .single();

  // Get location from equipment
  const { data: equipment } = await supabase
    .from('equipment')
    .select('location_id, min_temp, max_temp')
    .eq('id', parsed.data.equipmentId)
    .single();

  if (!equipment) {
    return NextResponse.json({ error: 'Equipment not found' }, { status: 404 });
  }

  const { data, error } = await supabase
    .from('temperature_logs')
    .insert({
      location_id: equipment.location_id,
      equipment_id: parsed.data.equipmentId,
      temperature: parsed.data.temperature,
      unit: parsed.data.unit,
      logged_by: user.id,
      notes: parsed.data.notes || null,
    })
    .select('*, equipment(*)')
    .single();

  if (error) {
    return apiError(error);
  }

  // Auto-alert: if temperature out of range, notify managers
  const temp = parsed.data.temperature;
  const minT = equipment.min_temp;
  const maxT = equipment.max_temp;
  const isOutOfRange = (minT != null && temp < minT) || (maxT != null && temp > maxT);

  if (isOutOfRange) {
    // Fire and forget — don't block the response
    const alertUrl = new URL('/api/alerts/temp-violation', request.url);
    fetch(alertUrl.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('Cookie') || '',
      },
      body: JSON.stringify({
        equipmentId: parsed.data.equipmentId,
        equipmentName: data.equipment?.name || 'Unknown',
        temperature: temp,
        unit: parsed.data.unit,
        minTemp: minT,
        maxTemp: maxT,
      }),
    }).catch(() => {}); // Don't fail temp log if alert fails
  }

  return NextResponse.json({ ...data, alertSent: isOutOfRange });
}
