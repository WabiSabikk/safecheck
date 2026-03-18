import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { pestControlSchema } from '@/lib/validations/pest-control';
import { isValidUuid } from '@/lib/utils/sanitize';
import { apiError } from '@/lib/utils/api-error';

export async function GET() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('pest_control_logs')
    .select('*, profile:profiles!pest_control_logs_created_by_fkey(display_name)')
    .order('service_date', { ascending: false })
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

  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id, role')
    .eq('id', user.id)
    .single();

  if (!profile || !['owner', 'manager'].includes(profile.role)) {
    return NextResponse.json({ error: 'Only managers can add pest control logs' }, { status: 403 });
  }

  const parsed = pestControlSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('pest_control_logs')
    .insert({
      org_id: profile.org_id,
      created_by: user.id,
      service_date: parsed.data.serviceDate,
      provider_name: parsed.data.providerName,
      areas_treated: parsed.data.areasTreated,
      treatment_type: parsed.data.treatmentType,
      findings: parsed.data.findings || null,
      next_service_date: parsed.data.nextServiceDate || null,
      report_notes: parsed.data.reportNotes || null,
    })
    .select('*, profile:profiles!pest_control_logs_created_by_fkey(display_name)')
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
    return NextResponse.json({ error: 'Valid pest control log ID required' }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['owner', 'manager'].includes(profile.role)) {
    return NextResponse.json({ error: 'Only managers can delete pest control logs' }, { status: 403 });
  }

  const { error } = await supabase
    .from('pest_control_logs')
    .delete()
    .eq('id', id);

  if (error) {
    return apiError(error);
  }

  return NextResponse.json({ success: true });
}
