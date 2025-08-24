-- Create storage bucket for backups if not exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('backups', 'backups', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for backup bucket (admin access only)
DO $$
BEGIN
  -- Check if policy exists before creating
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Admins can manage backup files'
  ) THEN
    CREATE POLICY "Admins can manage backup files" 
    ON storage.objects 
    FOR ALL 
    USING (bucket_id = 'backups' AND is_admin(auth.uid()))
    WITH CHECK (bucket_id = 'backups' AND is_admin(auth.uid()));
  END IF;
END
$$;

-- Schedule daily backup at 2 AM UTC
SELECT cron.schedule(
  'daily-database-backup',
  '0 2 * * *', -- Daily at 2 AM UTC
  $$
  SELECT
    net.http_post(
        url:='https://xngfyktcvkxbsvrkmpjc.supabase.co/functions/v1/database-backup',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhuZ2Z5a3Rjdmt4YnN2cmttcGpjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDM4NTMxMywiZXhwIjoyMDY5OTYxMzEzfQ.b_TKVxcMWG-VPc8FXPwuBGPQ5JRPPEKm6_1a8VoVFQQ"}'::jsonb,
        body:='{"scheduled": true, "timestamp": "' || now()::text || '"}'::jsonb
    ) as request_id;
  $$
);