import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiError } from '@/lib/utils/api-error';
import { isValidUuid } from '@/lib/utils/sanitize';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await params;

  if (!isValidUuid(id)) {
    return NextResponse.json({ error: 'Invalid checklist ID' }, { status: 400 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('checklist_submissions')
    .select('*, template:checklist_templates(*)')
    .eq('id', id)
    .single();

  if (error) {
    return apiError(error, 'Not found', 404);
  }

  return NextResponse.json(data);
}
