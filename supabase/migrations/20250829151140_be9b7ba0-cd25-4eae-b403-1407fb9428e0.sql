-- Fix overly permissive RLS policies for security

-- 1. Fix rate_limits table - restrict to admin/system access only
DROP POLICY IF EXISTS "Rate limits can be managed by system" ON public.rate_limits;

CREATE POLICY "Only admins can view rate limits" 
ON public.rate_limits 
FOR SELECT 
USING (is_admin(auth.uid()));

CREATE POLICY "Only admins can manage rate limits" 
ON public.rate_limits 
FOR ALL 
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- 2. Fix dashboard_configs table - restrict public access
DROP POLICY IF EXISTS "Anyone can view dashboard configs" ON public.dashboard_configs;

CREATE POLICY "Users can view relevant dashboard configs" 
ON public.dashboard_configs 
FOR SELECT 
USING (
  -- Users can see configs for their role and plan
  (role IS NULL OR role::text = (SELECT role::text FROM public.profiles WHERE id = auth.uid())) OR
  (plan IS NULL OR plan::text = (SELECT plan::text FROM public.profiles WHERE id = auth.uid())) OR
  -- Admins can see all configs
  is_admin(auth.uid())
);

-- 3. Add security event logging function
CREATE OR REPLACE FUNCTION public.log_security_event(
  event_type text,
  severity text DEFAULT 'info',
  details jsonb DEFAULT '{}'::jsonb
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.user_events (user_id, event_name, metadata)
  VALUES (
    auth.uid(),
    event_type,
    jsonb_build_object(
      'severity', severity,
      'timestamp', now(),
      'ip_address', current_setting('request.headers', true)::jsonb->>'cf-connecting-ip',
      'user_agent', current_setting('request.headers', true)::jsonb->>'user-agent',
      'details', details
    )
  );
END;
$$;

-- 4. Create security monitoring view for admins
CREATE OR REPLACE VIEW public.security_events AS
SELECT 
  ue.id,
  ue.user_id,
  p.email,
  p.role,
  ue.event_name,
  ue.metadata,
  ue.occurred_at
FROM public.user_events ue
LEFT JOIN public.profiles p ON p.id = ue.user_id
WHERE ue.event_name IN (
  'auth_failed_login',
  'auth_suspicious_activity',
  'permission_denied',
  'rate_limit_exceeded',
  'security_violation'
)
ORDER BY ue.occurred_at DESC;