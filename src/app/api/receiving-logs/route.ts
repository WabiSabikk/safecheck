import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { receivingLogSchema } from '@/lib/validations/receiving';
import { apiError } from '@/lib/utils/api-error';

export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('receiving_logs')
    .select('*, received_by_profile:profiles!receiving_logs_received_by_fkey(display_name)')
    .order('delivery_date', { ascending: false })
    .limit(100);

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

  const parsed = receivingLogSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { supplierName, deliveryDate, items, deliveryTemp, deliveryTempUnit, notes } = parsed.data;

  // Get user's first location
  const { data: access } = await supabase
    .from('location_access')
    .select('location_id')
    .eq('user_id', user.id)
    .limit(1)
    .single();

  if (!access) {
    return NextResponse.json({ error: 'No location access' }, { status: 403 });
  }

  const { data, error } = await supabase
    .from('receiving_logs')
    .insert({
      location_id: access.location_id,
      supplier_name: supplierName,
      delivery_date: deliveryDate || new Date().toISOString().split('T')[0],
      received_by: user.id,
      items,
      delivery_temp: deliveryTemp || null,
      delivery_temp_unit: deliveryTempUnit || 'F',
      notes: notes || null,
    })
    .select()
    .single();

  if (error) {
    return apiError(error);
  }

  return NextResponse.json(data);
}
