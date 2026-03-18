import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { allergenSchema, allergenUpdateSchema } from '@/lib/validations/food-labels';
import { isValidUuid } from '@/lib/utils/sanitize';
import { apiError } from '@/lib/utils/api-error';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data } = await supabase
    .from('menu_allergens')
    .select('*')
    .eq('is_active', true)
    .order('item_name');

  return NextResponse.json(data || []);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const body = await request.json();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('id', user.id)
    .single();

  const { data: location } = await supabase
    .from('locations')
    .select('id')
    .eq('org_id', profile?.org_id)
    .limit(1)
    .single();

  if (!location) {
    return NextResponse.json({ error: 'No location found' }, { status: 404 });
  }

  const parsed = allergenSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('menu_allergens')
    .insert({
      location_id: location.id,
      item_name: parsed.data.itemName,
      category: parsed.data.category || null,
      allergens: parsed.data.allergens,
      cross_contact_risk: parsed.data.crossContactRisk,
      storage_notes: parsed.data.storageNotes || null,
      separate_storage: parsed.data.separateStorage,
    })
    .select()
    .single();

  if (error) return apiError(error);
  return NextResponse.json(data);
}

export async function PUT(request: Request) {
  const supabase = await createClient();
  const body = await request.json();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const parsed = allergenUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('menu_allergens')
    .update({
      item_name: parsed.data.itemName,
      category: parsed.data.category || null,
      allergens: parsed.data.allergens,
      cross_contact_risk: parsed.data.crossContactRisk,
      storage_notes: parsed.data.storageNotes || null,
      separate_storage: parsed.data.separateStorage,
      updated_at: new Date().toISOString(),
    })
    .eq('id', parsed.data.id)
    .select()
    .single();

  if (error) return apiError(error);
  return NextResponse.json(data);
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!id || !isValidUuid(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const { error } = await supabase
    .from('menu_allergens')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return apiError(error);
  return NextResponse.json({ success: true });
}
