import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const locationId = searchParams.get('locationId');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const today = new Date().toISOString().split('T')[0];

  // Get today's checklists
  let checklistQuery = supabase
    .from('checklist_submissions')
    .select('*, template:checklist_templates(*)')
    .eq('scheduled_date', today);

  if (locationId) {
    checklistQuery = checklistQuery.eq('location_id', locationId);
  }

  const { data: checklists } = await checklistQuery;

  // Get today's temperature logs
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  let tempQuery = supabase
    .from('temperature_logs')
    .select('*, equipment(*)')
    .gte('logged_at', startOfDay.toISOString())
    .order('logged_at', { ascending: false });

  if (locationId) {
    tempQuery = tempQuery.eq('location_id', locationId);
  }

  const { data: tempLogs } = await tempQuery;

  // Get recent violations (last 7 days)
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  let violationsQuery = supabase
    .from('temperature_logs')
    .select('*, equipment(*)')
    .eq('is_in_range', false)
    .gte('logged_at', weekAgo.toISOString())
    .order('logged_at', { ascending: false })
    .limit(10);

  if (locationId) {
    violationsQuery = violationsQuery.eq('location_id', locationId);
  }

  const { data: violations } = await violationsQuery;

  // Get recent corrective actions
  let correctiveQuery = supabase
    .from('corrective_actions')
    .select('*')
    .gte('logged_at', weekAgo.toISOString())
    .order('logged_at', { ascending: false })
    .limit(10);

  if (locationId) {
    correctiveQuery = correctiveQuery.eq('location_id', locationId);
  }

  const { data: correctiveActions } = await correctiveQuery;

  // Calculate compliance
  const totalChecklists = checklists?.length || 0;
  const completedChecklists = checklists?.filter(c => c.status === 'completed').length || 0;
  const complianceRate = totalChecklists > 0
    ? Math.round((completedChecklists / totalChecklists) * 100)
    : 0;

  const totalTempLogs = tempLogs?.length || 0;
  const inRangeLogs = tempLogs?.filter(t => t.is_in_range).length || 0;
  const tempComplianceRate = totalTempLogs > 0
    ? Math.round((inRangeLogs / totalTempLogs) * 100)
    : 100;

  return NextResponse.json({
    checklists: checklists || [],
    tempLogs: tempLogs || [],
    violations: violations || [],
    correctiveActions: correctiveActions || [],
    stats: {
      checklistCompletion: complianceRate,
      totalChecklists,
      completedChecklists,
      tempCompliance: tempComplianceRate,
      totalTempLogs,
      violationCount: violations?.length || 0,
    },
  });
}
