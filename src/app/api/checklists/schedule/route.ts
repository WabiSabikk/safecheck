import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Creates today's checklist submissions from active templates
// Called on dashboard load or by cron job
export async function POST() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get user's profile and org
  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('id', user.id)
    .single();

  if (!profile?.org_id) {
    return NextResponse.json({ error: 'No organization' }, { status: 400 });
  }

  // Get all locations in org
  const { data: locations } = await supabase
    .from('locations')
    .select('id')
    .eq('org_id', profile.org_id);

  if (!locations || locations.length === 0) {
    return NextResponse.json({ error: 'No locations' }, { status: 400 });
  }

  // Get all active templates (system + org custom) — avoid string interpolation
  const [systemTpl, orgTpl] = await Promise.all([
    supabase.from('checklist_templates').select('*').eq('is_system', true),
    supabase.from('checklist_templates').select('*').eq('org_id', profile.org_id).eq('is_system', false),
  ]);
  const templates = [...(systemTpl.data || []), ...(orgTpl.data || [])];

  if (!templates || templates.length === 0) {
    return NextResponse.json({ created: 0 });
  }

  const today = new Date().toISOString().split('T')[0];
  let created = 0;

  // For each location, create submissions for each template
  for (const location of locations) {
    for (const template of templates) {
      // Check if submission already exists for today
      const { data: existing } = await supabase
        .from('checklist_submissions')
        .select('id')
        .eq('location_id', location.id)
        .eq('template_id', template.id)
        .eq('scheduled_date', today)
        .maybeSingle();

      if (!existing) {
        const { error } = await supabase
          .from('checklist_submissions')
          .insert({
            location_id: location.id,
            template_id: template.id,
            scheduled_date: today,
            status: 'pending',
          });

        if (!error) created++;
      }
    }
  }

  return NextResponse.json({ created, date: today });
}
