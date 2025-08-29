-- Fix security definer view issue
DROP VIEW IF EXISTS public.security_events;

-- Create a safer security events view without SECURITY DEFINER
-- Admins will be able to access it through RLS policies
CREATE VIEW public.security_events AS
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

-- Add RLS policy for security events view access
CREATE POLICY "Admins can view security events" 
ON public.user_events 
FOR SELECT 
USING (
  is_admin(auth.uid()) AND 
  event_name IN (
    'auth_failed_login',
    'auth_suspicious_activity',
    'permission_denied', 
    'rate_limit_exceeded',
    'security_violation'
  )
);