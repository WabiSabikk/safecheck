import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supplierSchema } from '@/lib/validations/suppliers';
import { isValidUuid } from '@/lib/utils/sanitize';
import { apiError } from '@/lib/utils/api-error';

export async function GET() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('suppliers')
    .select('*, profile:profiles!suppliers_created_by_fkey(display_name)')
    .order('supplier_name', { ascending: true })
    .limit(200);

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
    return NextResponse.json({ error: 'Only managers can add suppliers' }, { status: 403 });
  }

  const parsed = supplierSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('suppliers')
    .insert({
      org_id: profile.org_id,
      supplier_name: parsed.data.supplierName,
      contact_phone: parsed.data.contactPhone || null,
      contact_email: parsed.data.contactEmail || null,
      products: parsed.data.products || null,
      last_verification_date: parsed.data.lastVerificationDate || null,
      verification_method: parsed.data.verificationMethod || null,
      license_number: parsed.data.licenseNumber || null,
      status: parsed.data.status,
      notes: parsed.data.notes || null,
      created_by: user.id,
    })
    .select('*, profile:profiles!suppliers_created_by_fkey(display_name)')
    .single();

  if (error) {
    return apiError(error);
  }

  return NextResponse.json(data);
}

export async function PUT(request: Request) {
  const supabase = await createClient();
  const body = await request.json();
  const { id, ...updateData } = body;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!id || !isValidUuid(id)) {
    return NextResponse.json({ error: 'Valid supplier ID required' }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['owner', 'manager'].includes(profile.role)) {
    return NextResponse.json({ error: 'Only managers can update suppliers' }, { status: 403 });
  }

  const parsed = supplierSchema.safeParse(updateData);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('suppliers')
    .update({
      supplier_name: parsed.data.supplierName,
      contact_phone: parsed.data.contactPhone || null,
      contact_email: parsed.data.contactEmail || null,
      products: parsed.data.products || null,
      last_verification_date: parsed.data.lastVerificationDate || null,
      verification_method: parsed.data.verificationMethod || null,
      license_number: parsed.data.licenseNumber || null,
      status: parsed.data.status,
      notes: parsed.data.notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*, profile:profiles!suppliers_created_by_fkey(display_name)')
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
    return NextResponse.json({ error: 'Valid supplier ID required' }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['owner', 'manager'].includes(profile.role)) {
    return NextResponse.json({ error: 'Only managers can delete suppliers' }, { status: 403 });
  }

  const { error } = await supabase
    .from('suppliers')
    .delete()
    .eq('id', id);

  if (error) {
    return apiError(error);
  }

  return NextResponse.json({ success: true });
}
