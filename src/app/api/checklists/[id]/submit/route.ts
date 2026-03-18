import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiError } from '@/lib/utils/api-error';
import { isValidUuid } from '@/lib/utils/sanitize';

export async function POST(
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

  // Fetch submission with template
  const { data: submission, error: fetchError } = await supabase
    .from('checklist_submissions')
    .select('*, template:checklist_templates(*)')
    .eq('id', id)
    .single();

  if (fetchError) {
    return NextResponse.json({ error: 'Checklist not found' }, { status: 404 });
  }

  // Validate all required items are completed
  const template = submission.template;
  const responses = submission.responses || {};
  const requiredItems = (template.items as { id: string; is_required: boolean }[])
    .filter(item => item.is_required);

  const incomplete = requiredItems.filter(
    item => !responses[item.id]?.completed
  );

  if (incomplete.length > 0) {
    return NextResponse.json(
      { error: `${incomplete.length} required items not completed` },
      { status: 400 }
    );
  }

  // Mark as completed
  const { error: updateError } = await supabase
    .from('checklist_submissions')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      completed_by: user.id,
    })
    .eq('id', id);

  if (updateError) {
    return apiError(updateError);
  }

  return NextResponse.json({ success: true });
}
