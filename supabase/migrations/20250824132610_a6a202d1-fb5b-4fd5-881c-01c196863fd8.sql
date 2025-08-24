-- Enable required extensions for cron jobs and HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create backup metadata table
CREATE TABLE IF NOT EXISTS public.backup_metadata (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_date date NOT NULL,
  backup_time timestamp with time zone DEFAULT now(),
  file_path text NOT NULL,
  file_size bigint,
  encryption_key_hash text NOT NULL, -- Hash of encryption key for verification
  tables_backed_up text[] NOT NULL,
  status text CHECK (status IN ('in_progress', 'completed', 'failed')) DEFAULT 'in_progress',
  error_message text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.backup_metadata ENABLE ROW LEVEL SECURITY;

-- Create policies (admin only)
CREATE POLICY "Admins can manage backups" 
ON public.backup_metadata 
FOR ALL 
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_backup_metadata_date 
ON public.backup_metadata (backup_date DESC);