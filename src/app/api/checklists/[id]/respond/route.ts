import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiError } from '@/lib/utils/api-error';
import { isValidUuid } from '@/lib/utils/sanitize';
import { z } from 'zod';

const respondSchema = z.object({
  itemId: z.string().min(1),
  completed: z.boolean().optional(),
  note: z.string().max(1000).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await params;
  const body = await request.json();

  if (!isValidUuid(id)) {
    return NextResponse.json({ error: 'Invalid checklist ID' }, { status: 400 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsed = respondSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { itemId, completed, note } = parsed.data;

  // Fetch current submission
  const { data: submission, error: fetchError } = await supabase
    .from('checklist_submissions')
    .select('responses, status')
    .eq('id', id)
    .single();

  if (fetchError) {
    return NextResponse.json({ error: 'Checklist not found' }, { status: 404 });
  }

  // Update responses
  const responses = (submission.responses || {}) as Record<string, unknown>;
  responses[itemId] = {
    completed: completed ?? false,
    completed_at: completed ? new Date().toISOString() : null,
    completed_by: user.id,
    note: note || null,
  };

  // Update status to in_progress if currently pending
  const newStatus = submission.status === 'pending' ? 'in_progress' : submission.status;

  const { error: updateError } = await supabase
    .from('checklist_submissions')
    .update({
      responses,
      status: newStatus,
      started_at: submission.status === 'pending' ? new Date().toISOString() : undefined,
    })
    .eq('id', id);

  if (updateError) {
    return apiError(updateError);
  }

  return NextResponse.json({ success: true, responses });
}
