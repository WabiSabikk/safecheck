import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { foodLabelSchema } from '@/lib/validations/food-labels';
import { apiError } from '@/lib/utils/api-error';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('id', user.id)
    .single();

  // Get labels for all locations in org
  const { data: labels } = await supabase
    .from('food_labels')
    .select('*, profile:profiles!prepared_by(display_name)')
    .order('created_at', { ascending: false })
    .limit(50);

  // Get templates
  const { data: templates } = await supabase
    .from('food_label_templates')
    .select('*')
    .eq('org_id', profile?.org_id)
    .order('food_name');

  return NextResponse.json({ labels: labels || [], templates: templates || [] });
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

  // Get first location for user's org
  const { data: location } = await supabase
    .from('locations')
    .select('id')
    .eq('org_id', profile?.org_id)
    .limit(1)
    .single();

  if (!location) {
    return NextResponse.json({ error: 'No location found' }, { status: 404 });
  }

  const parsed = foodLabelSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const prepDate = parsed.data.prepDate || new Date().toISOString().split('T')[0];
  const expiryDate = parsed.data.expiryDate || calculateExpiry(prepDate, parsed.data.shelfLifeDays);

  const { data, error } = await supabase
    .from('food_labels')
    .insert({
      location_id: location.id,
      template_id: parsed.data.templateId || null,
      food_name: parsed.data.foodName,
      prep_date: prepDate,
      expiry_date: expiryDate,
      allergens: parsed.data.allergens,
      prepared_by: user.id,
      storage_instructions: parsed.data.storageInstructions || null,
      quantity: parsed.data.quantity,
    })
    .select()
    .single();

  if (error) return apiError(error);

  // Save as template if requested
  if (parsed.data.saveAsTemplate) {
    await supabase.from('food_label_templates').insert({
      org_id: profile?.org_id,
      food_name: parsed.data.foodName,
      shelf_life_days: parsed.data.shelfLifeDays,
      allergens: parsed.data.allergens,
      storage_instructions: parsed.data.storageInstructions || null,
    });
  }

  return NextResponse.json(data);
}

function calculateExpiry(prepDate: string, days: number): string {
  const d = new Date(prepDate);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}
