import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get('start') || (() => { const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().split('T')[0]; })();
  const endDate = searchParams.get('end') || new Date().toISOString().split('T')[0];

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get profile and org info
  const { data: profile } = await supabase
    .from('profiles')
    .select('*, organization:organizations(*)')
    .eq('id', user.id)
    .single();

  // Get location
  const { data: locations } = await supabase
    .from('locations')
    .select('*')
    .limit(1);

  const location = locations?.[0];

  // Get checklists for date range
  const { data: checklists } = await supabase
    .from('checklist_submissions')
    .select('*, template:checklist_templates(name, checklist_type)')
    .gte('scheduled_date', startDate)
    .lte('scheduled_date', endDate)
    .order('scheduled_date', { ascending: false });

  // Get temperature logs for date range
  const { data: tempLogs } = await supabase
    .from('temperature_logs')
    .select('*, equipment:equipment(name, equipment_type)')
    .gte('logged_at', `${startDate}T00:00:00`)
    .lte('logged_at', `${endDate}T23:59:59`)
    .order('logged_at', { ascending: false });

  // Get corrective actions
  const { data: correctiveActions } = await supabase
    .from('corrective_actions')
    .select('*')
    .gte('logged_at', `${startDate}T00:00:00`)
    .lte('logged_at', `${endDate}T23:59:59`)
    .order('logged_at', { ascending: false });

  // Calculate stats
  const totalChecklists = checklists?.length || 0;
  const completedChecklists = checklists?.filter(c => c.status === 'completed').length || 0;
  const checklistCompliance = totalChecklists > 0 ? Math.round((completedChecklists / totalChecklists) * 100) : 0;

  const totalTempLogs = tempLogs?.length || 0;
  const inRangeLogs = tempLogs?.filter(t => t.is_in_range).length || 0;
  const tempCompliance = totalTempLogs > 0 ? Math.round((inRangeLogs / totalTempLogs) * 100) : 100;

  const totalCorrectiveActions = correctiveActions?.length || 0;
  const resolvedActions = correctiveActions?.filter(a => a.is_resolved).length || 0;

  // Return data as JSON — client will generate PDF
  return NextResponse.json({
    restaurant: {
      name: location?.name || profile?.organization?.name || 'Restaurant',
      address: location?.address || '',
      licenseNumber: location?.license_number || '',
    },
    dateRange: { start: startDate, end: endDate },
    stats: {
      checklistCompliance,
      totalChecklists,
      completedChecklists,
      tempCompliance,
      totalTempLogs,
      inRangeLogs,
      totalCorrectiveActions,
      resolvedActions,
    },
    checklists: (checklists || []).map(c => ({
      date: c.scheduled_date,
      name: c.template?.name || 'Checklist',
      type: c.template?.checklist_type || '',
      status: c.status,
      completedAt: c.completed_at,
    })),
    temperatureLogs: (tempLogs || []).map(t => ({
      date: new Date(t.logged_at).toLocaleDateString(),
      time: new Date(t.logged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      equipment: t.equipment?.name || '',
      temperature: t.temperature,
      unit: t.unit,
      inRange: t.is_in_range,
      minTemp: t.min_temp_snapshot,
      maxTemp: t.max_temp_snapshot,
    })),
    correctiveActions: (correctiveActions || []).map(a => ({
      date: new Date(a.logged_at).toLocaleDateString(),
      issueType: a.issue_type,
      description: a.description,
      actionTaken: a.action_taken,
      isResolved: a.is_resolved,
      resolvedAt: a.resolved_at ? new Date(a.resolved_at).toLocaleDateString() : null,
    })),
    generatedAt: new Date().toISOString(),
  });
}
