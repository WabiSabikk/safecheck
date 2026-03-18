import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  // This week's checklists
  const { data: thisWeekChecklists } = await supabase
    .from('checklist_submissions')
    .select('status')
    .gte('scheduled_date', weekAgo.toISOString().split('T')[0])
    .lte('scheduled_date', now.toISOString().split('T')[0]);

  // Last week's checklists (for comparison)
  const { data: lastWeekChecklists } = await supabase
    .from('checklist_submissions')
    .select('status')
    .gte('scheduled_date', twoWeeksAgo.toISOString().split('T')[0])
    .lt('scheduled_date', weekAgo.toISOString().split('T')[0]);

  // This week's temp logs
  const { data: thisWeekTemps } = await supabase
    .from('temperature_logs')
    .select('is_in_range')
    .gte('logged_at', weekAgo.toISOString());

  // Last week's temp logs
  const { data: lastWeekTemps } = await supabase
    .from('temperature_logs')
    .select('is_in_range')
    .gte('logged_at', twoWeeksAgo.toISOString())
    .lt('logged_at', weekAgo.toISOString());

  // This week's corrective actions
  const { data: thisWeekActions } = await supabase
    .from('corrective_actions')
    .select('is_resolved')
    .gte('logged_at', weekAgo.toISOString());

  // Calculate metrics
  const thisWeek = {
    totalChecklists: thisWeekChecklists?.length || 0,
    completedChecklists: thisWeekChecklists?.filter(c => c.status === 'completed').length || 0,
    missedChecklists: thisWeekChecklists?.filter(c => c.status === 'pending' || c.status === 'overdue').length || 0,
    totalTemps: thisWeekTemps?.length || 0,
    inRangeTemps: thisWeekTemps?.filter(t => t.is_in_range).length || 0,
    violations: thisWeekTemps?.filter(t => !t.is_in_range).length || 0,
    totalActions: thisWeekActions?.length || 0,
    resolvedActions: thisWeekActions?.filter(a => a.is_resolved).length || 0,
  };

  const lastWeek = {
    totalChecklists: lastWeekChecklists?.length || 0,
    completedChecklists: lastWeekChecklists?.filter(c => c.status === 'completed').length || 0,
    totalTemps: lastWeekTemps?.length || 0,
    inRangeTemps: lastWeekTemps?.filter(t => t.is_in_range).length || 0,
    violations: lastWeekTemps?.filter(t => !t.is_in_range).length || 0,
  };

  // Calculate compliance percentages
  const thisWeekChecklistCompliance = thisWeek.totalChecklists > 0
    ? Math.round((thisWeek.completedChecklists / thisWeek.totalChecklists) * 100) : 0;
  const lastWeekChecklistCompliance = lastWeek.totalChecklists > 0
    ? Math.round((lastWeek.completedChecklists / lastWeek.totalChecklists) * 100) : 0;

  const thisWeekTempCompliance = thisWeek.totalTemps > 0
    ? Math.round((thisWeek.inRangeTemps / thisWeek.totalTemps) * 100) : 100;
  const lastWeekTempCompliance = lastWeek.totalTemps > 0
    ? Math.round((lastWeek.inRangeTemps / lastWeek.totalTemps) * 100) : 100;

  return NextResponse.json({
    thisWeek: {
      ...thisWeek,
      checklistCompliance: thisWeekChecklistCompliance,
      tempCompliance: thisWeekTempCompliance,
    },
    lastWeek: {
      ...lastWeek,
      checklistCompliance: lastWeekChecklistCompliance,
      tempCompliance: lastWeekTempCompliance,
    },
    trends: {
      checklistTrend: thisWeekChecklistCompliance - lastWeekChecklistCompliance,
      tempTrend: thisWeekTempCompliance - lastWeekTempCompliance,
      violationTrend: thisWeek.violations - lastWeek.violations,
    },
  });
}
