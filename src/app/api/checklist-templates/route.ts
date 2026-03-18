import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checklistTemplateSchema } from '@/lib/validations/checklist';
import { isValidUuid } from '@/lib/utils/sanitize';
import { apiError } from '@/lib/utils/api-error';

export async function GET(request: Request) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get user's org_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('id', user.id)
    .single();

  // Use two separate queries to avoid string interpolation in filter
  const [systemResult, orgResult] = await Promise.all([
    supabase.from('checklist_templates').select('*').eq('is_system', true),
    profile?.org_id
      ? supabase.from('checklist_templates').select('*').eq('org_id', profile.org_id).eq('is_system', false)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const data = [...(systemResult.data || []), ...(orgResult.data || [])]
    .sort((a, b) => {
      if (a.is_system !== b.is_system) return a.is_system ? -1 : 1;
      return (a.name || '').localeCompare(b.name || '');
    });
  const error = systemResult.error || orgResult.error;

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

  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id, role')
    .eq('id', user.id)
    .single();

  if (!profile || !['owner', 'manager'].includes(profile.role)) {
    return NextResponse.json({ error: 'Only managers can create templates' }, { status: 403 });
  }

  const parsed = checklistTemplateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { name, checklist_type, scheduled_time, overdue_after_minutes, items } = parsed.data;

  const validatedItems = items.map((item, i: number) => ({
    id: `custom-${Date.now()}-${i}`,
    category: item.category || 'General',
    description: item.description,
    is_required: item.is_required ?? true,
    position: i,
  }));

  const { data, error } = await supabase
    .from('checklist_templates')
    .insert({
      org_id: profile.org_id,
      name,
      checklist_type,
      scheduled_time: scheduled_time || null,
      overdue_after_minutes: overdue_after_minutes || 180,
      items: validatedItems,
      is_system: false,
    })
    .select()
    .single();

  if (error) {
    return apiError(error);
  }

  return NextResponse.json(data);
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!id || !isValidUuid(id)) {
    return NextResponse.json({ error: 'Valid template ID required' }, { status: 400 });
  }

  // Verify not system template
  const { data: template } = await supabase
    .from('checklist_templates')
    .select('is_system')
    .eq('id', id)
    .single();

  if (template?.is_system) {
    return NextResponse.json({ error: 'Cannot delete system templates' }, { status: 403 });
  }

  const { error } = await supabase
    .from('checklist_templates')
    .delete()
    .eq('id', id);

  if (error) {
    return apiError(error);
  }

  return NextResponse.json({ success: true });
}
