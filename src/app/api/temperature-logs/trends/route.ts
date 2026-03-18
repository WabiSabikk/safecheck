import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiError } from '@/lib/utils/api-error';

export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const parsedDays = parseInt(searchParams.get('days') || '7', 10);
  const days = Math.max(1, Math.min(isNaN(parsedDays) ? 7 : parsedDays, 365));

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from('temperature_logs')
    .select('id, temperature, unit, is_in_range, logged_at, min_temp_snapshot, max_temp_snapshot, equipment:equipment(id, name, equipment_type)')
    .gte('logged_at', startDate.toISOString())
    .order('logged_at', { ascending: true });

  if (error) {
    return apiError(error);
  }

  // Calculate stats
  const total = data?.length || 0;
  const inRange = data?.filter(d => d.is_in_range).length || 0;
  const compliance = total > 0 ? Math.round((inRange / total) * 100) : 100;

  return NextResponse.json({
    logs: data || [],
    stats: {
      total,
      inRange,
      outOfRange: total - inRange,
      compliance,
    },
  });
}
