import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Resend } from 'resend';
import { escapeHtml } from '@/lib/utils/sanitize';
import { EMAIL_FROM } from '@/lib/email/config';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Called by cron job or scheduled function to check overdue checklists
export async function POST(request: Request) {
  const supabase = await createClient();

  // Verify cron secret or auth
  const authHeader = request.headers.get('Authorization');
  const cronSecret = process.env.CRON_SECRET;
  const isCron = cronSecret && authHeader === `Bearer ${cronSecret}`;

  if (!isCron) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const today = new Date().toISOString().split('T')[0];

  // Find all pending/overdue checklists for today
  const { data: overdue } = await supabase
    .from('checklist_submissions')
    .select(`
      id, scheduled_date, status,
      template:checklist_templates!template_id(name, checklist_type, scheduled_time, overdue_after_minutes),
      location:locations!location_id(name, org_id)
    `)
    .eq('scheduled_date', today)
    .in('status', ['pending', 'in_progress']);

  if (!overdue?.length) {
    return NextResponse.json({ message: 'No overdue checklists', sent: 0 });
  }

  const now = new Date();
  let sentCount = 0;

  for (const checklist of overdue) {
    const template = checklist.template as any;
    const location = checklist.location as any;
    if (!template?.scheduled_time || !location?.org_id) continue;

    // Check if it's past the scheduled time + overdue minutes
    const [hours, minutes] = template.scheduled_time.split(':').map(Number);
    const scheduledTime = new Date(now);
    scheduledTime.setHours(hours, minutes + (template.overdue_after_minutes || 30), 0, 0);

    if (now < scheduledTime) continue; // Not overdue yet

    // Check if we already sent a reminder for this checklist today
    const { data: existingAlert } = await supabase
      .from('alert_log')
      .select('id')
      .eq('alert_type', 'checklist_overdue')
      .eq('org_id', location.org_id)
      .gte('sent_at', today)
      .limit(1);

    if (existingAlert?.length) continue; // Already sent

    // Get managers to notify
    const { data: managers } = await supabase
      .from('profiles')
      .select('id, email, display_name')
      .eq('org_id', location.org_id)
      .in('role', ['owner', 'manager']);

    const safeTemplateName = escapeHtml(template.name);
    const safeLocationName = escapeHtml(location.name);
    const safeScheduledTime = escapeHtml(template.scheduled_time);

    // Log alert
    await supabase.from('alert_log').insert({
      org_id: location.org_id,
      location_id: null,
      alert_type: 'checklist_overdue',
      title: `Checklist Overdue: ${safeTemplateName}`,
      body: `${safeTemplateName} at ${safeLocationName} was not completed by ${safeScheduledTime}.`,
      channel: 'email',
    });

    // Send emails
    if (resend && managers?.length) {
      for (const manager of managers) {
        if (!manager.email) continue;
        await resend.emails.send({
          from: EMAIL_FROM.reminders,
          to: manager.email,
          subject: `Reminder: ${safeTemplateName} not completed`,
          html: `
            <div style="font-family: sans-serif; max-width: 500px;">
              <h2 style="color: #F59E0B;">Checklist Reminder</h2>
              <p><strong>${safeTemplateName}</strong> at <strong>${safeLocationName}</strong> was scheduled for ${safeScheduledTime} and has not been completed.</p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://safecheck.app'}/checklists/today"
                 style="display: inline-block; margin-top: 12px; padding: 10px 20px; background: #10B981; color: white; text-decoration: none; border-radius: 6px;">
                Complete Now
              </a>
            </div>
          `,
        }).catch(() => null);
        sentCount++;
      }
    }
  }

  return NextResponse.json({ sent: sentCount, overdueCount: overdue.length });
}

// Vercel Cron sends GET requests
export { POST as GET };
