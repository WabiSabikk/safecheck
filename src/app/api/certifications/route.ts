import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { certificationSchema } from '@/lib/validations/certifications';
import { isValidUuid } from '@/lib/utils/sanitize';
import { apiError } from '@/lib/utils/api-error';

export async function GET() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('certifications')
    .select('*, user:profiles!certifications_user_id_fkey(display_name, role)')
    .order('expiry_date', { ascending: true });

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
    return NextResponse.json({ error: 'Only managers can add certifications' }, { status: 403 });
  }

  const parsed = certificationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('certifications')
    .insert({
      user_id: parsed.data.userId,
      org_id: profile.org_id,
      cert_type: parsed.data.certType,
      cert_name: parsed.data.certName,
      issued_date: parsed.data.issuedDate || null,
      expiry_date: parsed.data.expiryDate || null,
      cert_number: parsed.data.certNumber || null,
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
    return NextResponse.json({ error: 'Valid certification ID required' }, { status: 400 });
  }

  // Only owner/manager can delete certifications
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['owner', 'manager'].includes(profile.role)) {
    return NextResponse.json({ error: 'Only managers can delete certifications' }, { status: 403 });
  }

  const { error } = await supabase
    .from('certifications')
    .delete()
    .eq('id', id);

  if (error) {
    return apiError(error);
  }

  return NextResponse.json({ success: true });
}
