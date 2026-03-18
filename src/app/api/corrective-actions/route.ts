import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { correctiveActionSchema } from '@/lib/validations/temperature';
import { isValidUuid } from '@/lib/utils/sanitize';
import { apiError } from '@/lib/utils/api-error';

export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const locationId = searchParams.get('locationId');
  const status = searchParams.get('status'); // 'open' | 'resolved' | 'all'

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let query = supabase
    .from('corrective_actions')
    .select('*, temperature_log:temperature_logs(temperature, unit, equipment:equipment(name)), logged_by_profile:profiles!corrective_actions_logged_by_fkey(display_name)')
    .order('logged_at', { ascending: false })
    .limit(50);

  if (locationId) {
    if (!isValidUuid(locationId)) {
      return NextResponse.json({ error: 'Invalid location ID' }, { status: 400 });
    }
    query = query.eq('location_id', locationId);
  }
  if (status === 'open') query = query.eq('is_resolved', false);
  if (status === 'resolved') query = query.eq('is_resolved', true);

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

  const parsed = correctiveActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  // Get location from temperature log if linked
  let locationId: string | null = body.locationId || null;

  if (locationId && !isValidUuid(locationId)) {
    return NextResponse.json({ error: 'Invalid location ID' }, { status: 400 });
  }

  if (parsed.data.temperatureLogId && !locationId) {
    const { data: tempLog } = await supabase
      .from('temperature_logs')
      .select('location_id')
      .eq('id', parsed.data.temperatureLogId)
      .single();
    locationId = tempLog?.location_id || null;
  }

  if (!locationId) {
    return NextResponse.json({ error: 'Location required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('corrective_actions')
    .insert({
      location_id: locationId,
      temperature_log_id: parsed.data.temperatureLogId || null,
      issue_type: parsed.data.issueType,
      description: parsed.data.description,
      action_taken: parsed.data.actionTaken,
      logged_by: user.id,
    })
    .select()
    .single();

  if (error) {
    return apiError(error);
  }

  return NextResponse.json(data);
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const body = await request.json();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id, is_resolved } = body;
  if (!id || !isValidUuid(id)) {
    return NextResponse.json({ error: 'Valid action ID required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('corrective_actions')
    .update({
      is_resolved: is_resolved ?? true,
      resolved_at: is_resolved !== false ? new Date().toISOString() : null,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return apiError(error);
  }

  return NextResponse.json(data);
}
