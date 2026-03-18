-- Data retention: Clean up records older than 365 days (FDA requirement: keep 30-365 days)
-- Uses pg_cron extension (needs to be enabled in Supabase Dashboard → Extensions)

-- Function to clean old records
CREATE OR REPLACE FUNCTION public.cleanup_old_records()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete temperature logs older than 365 days
  DELETE FROM temperature_logs WHERE logged_at < NOW() - INTERVAL '365 days';

  -- Delete corrective actions older than 365 days
  DELETE FROM corrective_actions WHERE logged_at < NOW() - INTERVAL '365 days';

  -- Delete checklist submissions older than 365 days
  DELETE FROM checklist_submissions WHERE scheduled_date < CURRENT_DATE - INTERVAL '365 days';

  -- Delete receiving logs older than 365 days
  DELETE FROM receiving_logs WHERE delivery_date < CURRENT_DATE - INTERVAL '365 days';
END;
$$;

-- Schedule: run daily at 3 AM UTC
-- Requires pg_cron extension to be enabled:
-- SELECT cron.schedule('cleanup-old-records', '0 3 * * *', 'SELECT public.cleanup_old_records()');
