import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Resend } from 'resend';
import { escapeHtml } from '@/lib/utils/sanitize';
import { EMAIL_FROM } from '@/lib/email/config';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Called weekly by cron to send digest email to managers
export async function POST(request: Request) {
  const supabase = await createClient();

  const authHeader = request.headers.get('Authorization');
  const cronSecret = process.env.CRON_SECRET;
  const isCron = cronSecret && authHeader === `Bearer ${cronSecret}`;

  if (!isCron) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get all orgs with managers
  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, name');

  if (!orgs?.length) return NextResponse.json({ sent: 0 });

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoStr = weekAgo.toISOString();
  let totalSent = 0;

  for (const org of orgs) {
    // Gather weekly stats
    const [tempLogs, checklists, alerts, certs] = await Promise.all([
      supabase
        .from('temperature_logs')
        .select('temperature, is_in_range', { count: 'exact' })
        .gte('logged_at', weekAgoStr),
      supabase
        .from('checklist_submissions')
        .select('status', { count: 'exact' })
        .gte('created_at', weekAgoStr),
      supabase
        .from('alert_log')
        .select('id', { count: 'exact' })
        .eq('org_id', org.id)
        .gte('sent_at', weekAgoStr),
      supabase
        .from('certifications')
        .select('cert_name, expiry_date')
        .eq('org_id', org.id)
        .gte('expiry_date', new Date().toISOString().split('T')[0])
        .lte('expiry_date', new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]),
    ]);

    const totalTemps = tempLogs.count || 0;
    const inRangeTemps = tempLogs.data?.filter(t => t.is_in_range).length || 0;
    const tempComplianceRate = totalTemps > 0 ? Math.round((inRangeTemps / totalTemps) * 100) : 100;

    const totalChecklists = checklists.count || 0;
    const completedChecklists = checklists.data?.filter(c => c.status === 'completed').length || 0;
    const checklistRate = totalChecklists > 0 ? Math.round((completedChecklists / totalChecklists) * 100) : 100;

    const alertCount = alerts.count || 0;
    const expiringCerts = certs.data || [];

    // Get managers with email digest enabled
    const { data: managers } = await supabase
      .from('profiles')
      .select('email, display_name')
      .eq('org_id', org.id)
      .in('role', ['owner', 'manager']);

    if (!resend || !managers?.length) continue;

    const safeOrgName = escapeHtml(org.name);
    const certRows = expiringCerts.length > 0
      ? expiringCerts.map(c => `<tr><td style="padding:4px 8px;">${escapeHtml(c.cert_name)}</td><td style="padding:4px 8px;">${escapeHtml(c.expiry_date)}</td></tr>`).join('')
      : '<tr><td colspan="2" style="padding:4px 8px; color:#6B7280;">None expiring soon</td></tr>';

    for (const manager of managers) {
      if (!manager.email) continue;

      await resend.emails.send({
        from: EMAIL_FROM.digest,
        to: manager.email,
        subject: `Weekly Safety Report — ${safeOrgName}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px;">
            <h2 style="color: #10B981;">📊 Weekly Safety Report</h2>
            <p style="color: #6B7280;">${safeOrgName} — Week of ${weekAgo.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} to ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>

            <table style="width:100%; border-collapse:collapse; margin:16px 0;">
              <tr style="background:#F0FDF4;">
                <td style="padding:12px; text-align:center;">
                  <div style="font-size:28px; font-weight:bold; color:${tempComplianceRate >= 95 ? '#10B981' : tempComplianceRate >= 80 ? '#F59E0B' : '#DC2626'};">${tempComplianceRate}%</div>
                  <div style="font-size:12px; color:#6B7280;">Temp Compliance</div>
                </td>
                <td style="padding:12px; text-align:center;">
                  <div style="font-size:28px; font-weight:bold; color:${checklistRate >= 90 ? '#10B981' : checklistRate >= 70 ? '#F59E0B' : '#DC2626'};">${checklistRate}%</div>
                  <div style="font-size:12px; color:#6B7280;">Checklists Done</div>
                </td>
                <td style="padding:12px; text-align:center;">
                  <div style="font-size:28px; font-weight:bold; color:${alertCount === 0 ? '#10B981' : '#DC2626'};">${alertCount}</div>
                  <div style="font-size:12px; color:#6B7280;">Alerts</div>
                </td>
              </tr>
            </table>

            <h3 style="margin-top:20px;">Temperature Readings</h3>
            <p>${totalTemps} readings this week. ${inRangeTemps} in safe range, ${totalTemps - inRangeTemps} violations.</p>

            <h3>Checklists</h3>
            <p>${completedChecklists} of ${totalChecklists} completed this week.</p>

            <h3>Expiring Certifications (next 30 days)</h3>
            <table style="width:100%; border-collapse:collapse; border:1px solid #E5E7EB;">
              <tr style="background:#F9FAFB;"><th style="padding:4px 8px; text-align:left;">Certification</th><th style="padding:4px 8px; text-align:left;">Expires</th></tr>
              ${certRows}
            </table>

            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://safecheck.app'}/reports"
               style="display:inline-block; margin-top:16px; padding:10px 20px; background:#10B981; color:white; text-decoration:none; border-radius:6px;">
              View Full Report
            </a>

            <p style="margin-top:24px; font-size:12px; color:#9CA3AF;">
              You receive this because you're a manager at ${safeOrgName}.
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://safecheck.app'}/settings">Manage preferences</a>
            </p>
          </div>
        `,
      }).catch(() => null);
      totalSent++;
    }
  }

  return NextResponse.json({ sent: totalSent });
}

// Vercel Cron sends GET requests
export { POST as GET };
