-- Add photo_url to corrective_actions and temperature_logs
ALTER TABLE corrective_actions ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE temperature_logs ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Create storage bucket for photos (run via Supabase Dashboard or API)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('photos', 'photos', false);
