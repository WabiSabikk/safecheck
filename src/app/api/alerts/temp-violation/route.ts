import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Resend } from 'resend';
import { escapeHtml, isValidUuid } from '@/lib/utils/sanitize';
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/utils/rate-limit';
import { EMAIL_FROM } from '@/lib/email/config';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rl = checkRateLimit(`alert:${ip}`, RATE_LIMITS.alerts);
  if (!rl.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const supabase = await createClient();
  const body = await request.json();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { equipmentName, temperature, unit, minTemp, maxTemp, equipmentId } = body;

  // Validate inputs
  if (!isValidUuid(equipmentId)) {
    return NextResponse.json({ error: 'Invalid equipment ID' }, { status: 400 });
  }
  if (typeof temperature !== 'number' || typeof minTemp !== 'number' || typeof maxTemp !== 'number') {
    return NextResponse.json({ error: 'Invalid temperature values' }, { status: 400 });
  }
  if (!['F', 'C'].includes(unit)) {
    return NextResponse.json({ error: 'Invalid unit' }, { status: 400 });
  }

  // Get user's org and all managers
  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id, display_name')
    .eq('id', user.id)
    .single();

  if (!profile?.org_id) {
    return NextResponse.json({ error: 'No organization' }, { status: 400 });
  }

  // Find managers/owners to notify
  const { data: managers } = await supabase
    .from('profiles')
    .select('id, email, display_name')
    .eq('org_id', profile.org_id)
    .in('role', ['owner', 'manager']);

  // Escape user-provided strings for safe HTML rendering
  const safeEquipmentName = escapeHtml(equipmentName);
  const safeDisplayName = escapeHtml(profile.display_name);

  // Log the alert
  const { data: location } = await supabase
    .from('equipment')
    .select('location_id')
    .eq('id', equipmentId)
    .single();

  await supabase.from('alert_log').insert({
    org_id: profile.org_id,
    location_id: location?.location_id,
    alert_type: 'temp_violation',
    title: `Temperature Violation: ${safeEquipmentName}`,
    body: `${safeEquipmentName} is at ${temperature}°${unit} (safe range: ${minTemp}°-${maxTemp}°${unit}). Logged by ${safeDisplayName}.`,
    recipient_id: null,
    channel: 'email',
  });

  // Send email to each manager
  if (resend && managers?.length) {
    const emailPromises = managers
      .filter(m => m.email)
      .map(manager =>
        resend.emails.send({
          from: EMAIL_FROM.alerts,
          to: manager.email!,
          subject: `Temperature Alert: ${safeEquipmentName} at ${temperature} ${unit}`,
          html: `
            <div style="font-family: sans-serif; max-width: 500px;">
              <h2 style="color: #DC2626;">Temperature Violation</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 8px; font-weight: bold;">Equipment</td><td style="padding: 8px;">${safeEquipmentName}</td></tr>
                <tr><td style="padding: 8px; font-weight: bold;">Current Temp</td><td style="padding: 8px; color: #DC2626; font-size: 20px;">${escapeHtml(temperature)}&deg;${escapeHtml(unit)}</td></tr>
                <tr><td style="padding: 8px; font-weight: bold;">Safe Range</td><td style="padding: 8px;">${escapeHtml(minTemp)}&deg; &mdash; ${escapeHtml(maxTemp)}&deg;${escapeHtml(unit)}</td></tr>
                <tr><td style="padding: 8px; font-weight: bold;">Logged By</td><td style="padding: 8px;">${safeDisplayName}</td></tr>
                <tr><td style="padding: 8px; font-weight: bold;">Time</td><td style="padding: 8px;">${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })}</td></tr>
              </table>
              <p style="margin-top: 16px; padding: 12px; background: #FEF2F2; border-radius: 8px;">
                <strong>Action Required:</strong> Check the equipment immediately and log a corrective action.
              </p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://safecheck.app'}/corrective-actions"
                 style="display: inline-block; margin-top: 12px; padding: 10px 20px; background: #DC2626; color: white; text-decoration: none; border-radius: 6px;">
                Log Corrective Action
              </a>
            </div>
          `,
        }).catch(() => null)
      );

    await Promise.allSettled(emailPromises);
  }

  return NextResponse.json({ sent: true, managersNotified: managers?.length || 0 });
}
