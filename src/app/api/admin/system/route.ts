import { NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/admin/check-admin';
import { supabaseAdmin } from '@/lib/supabase/admin';

const TABLES = [
  'organizations',
  'profiles',
  'locations',
  'location_access',
  'equipment',
  'checklist_templates',
  'checklist_submissions',
  'temperature_logs',
  'corrective_actions',
  'certifications',
  'food_labels',
  'allergens',
  'receiving_logs',
  'notification_preferences',
] as const;

export async function GET() {
  const auth = await checkAdmin();
  if (!auth.authorized) return auth.response;

  const tables = [];
  for (const table of TABLES) {
    const { count } = await supabaseAdmin
      .from(table)
      .select('*', { count: 'exact', head: true });
    tables.push({ name: table, count: count || 0 });
  }

  // Sort by count descending
  tables.sort((a, b) => b.count - a.count);

  return NextResponse.json({ tables });
}
