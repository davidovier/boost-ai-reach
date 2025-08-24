-- Create alerts table for storing system alerts
CREATE TABLE public.alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- Admin-only access to alerts
CREATE POLICY "Admins can view all alerts" 
ON public.alerts 
FOR SELECT 
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert alerts" 
ON public.alerts 
FOR INSERT 
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update alerts" 
ON public.alerts 
FOR UPDATE 
USING (public.is_admin(auth.uid()));

-- Index for performance
CREATE INDEX idx_alerts_created_at ON public.alerts(created_at DESC);
CREATE INDEX idx_alerts_type ON public.alerts(type);
CREATE INDEX idx_alerts_severity ON public.alerts(severity);

-- Create alerting schedule (check every 5 minutes)
SELECT cron.schedule(
  'alerting-checks',
  '*/5 * * * *',
  $$
  SELECT
    net.http_get(
      url := 'https://xngfyktcvkxbsvrkmpjc.supabase.co/functions/v1/alerting?action=check',
      headers := '{"Authorization": "Bearer ' || current_setting('app.settings.service_role_key', true) || '"}'::jsonb
    ) as response;
  $$
);