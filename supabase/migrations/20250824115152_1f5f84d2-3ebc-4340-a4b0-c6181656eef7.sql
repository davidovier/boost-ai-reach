-- Fix security warnings: Configure proper auth settings

-- 1. Set OTP expiry to recommended value (default is too long)
-- Note: This is typically configured in Supabase dashboard, but we can set via SQL if supported

-- 2. Enable leaked password protection
-- This is also typically a dashboard setting, but we can try to enable it

-- For now, let's create a comment-based migration noting these need dashboard configuration
-- as these are auth configuration settings that may require dashboard access

-- Security configurations that need dashboard attention:
-- 1. Auth > Settings > OTP Expiry should be set to reasonable time (5-10 minutes)
-- 2. Auth > Settings > Password Protection should be enabled

-- Create a table to track security configuration status for admin reference
CREATE TABLE IF NOT EXISTS public.security_config_status (
  id SERIAL PRIMARY KEY,
  configuration_item TEXT NOT NULL,
  status TEXT NOT NULL,
  required_action TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert security configuration tracking
INSERT INTO public.security_config_status (configuration_item, status, required_action)
VALUES 
  ('OTP Expiry', 'needs_configuration', 'Set OTP expiry to 5-10 minutes in Supabase Dashboard > Auth > Settings'),
  ('Leaked Password Protection', 'needs_configuration', 'Enable leaked password protection in Supabase Dashboard > Auth > Settings')
ON CONFLICT DO NOTHING;

-- Enable RLS on security config table
ALTER TABLE public.security_config_status ENABLE ROW LEVEL SECURITY;

-- Only admins can view security configuration status
CREATE POLICY "Admins can view security config" ON public.security_config_status
  FOR SELECT USING (is_admin(auth.uid()));