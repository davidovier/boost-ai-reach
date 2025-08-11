-- Phase 1: CRITICAL - Fix Privilege Escalation
-- Drop existing policies that allow users to update their own profiles without restrictions
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create separate policies for different profile update scenarios
-- Users can update non-sensitive profile fields (name, email)
CREATE POLICY "Users can update basic profile info" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id AND
  -- Ensure role and plan cannot be changed by users
  role = (SELECT role FROM public.profiles WHERE id = auth.uid()) AND
  plan = (SELECT plan FROM public.profiles WHERE id = auth.uid())
);

-- Only admins can update user roles and plans
CREATE POLICY "Admins can update user roles and plans" 
ON public.profiles 
FOR UPDATE 
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Phase 2: Fix Security Definer Functions
-- Update existing functions to include proper search_path security

-- Fix get_user_role function
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT role FROM public.profiles WHERE id = user_id;
$function$;

-- Fix is_admin function
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT public.get_user_role(user_id) = 'admin';
$function$;

-- Fix is_manager_or_admin function
CREATE OR REPLACE FUNCTION public.is_manager_or_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT public.get_user_role(user_id) IN ('manager', 'admin');
$function$;

-- Fix handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = ''
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, name, role, plan)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.raw_user_meta_data ->> 'full_name'),
    'user',
    'free'
  );
  
  -- Create initial usage metrics
  INSERT INTO public.usage_metrics (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$function$;

-- Fix get_user_plan_limits function
CREATE OR REPLACE FUNCTION public.get_user_plan_limits(user_id uuid)
RETURNS TABLE(max_sites integer, max_prompts integer, max_scans integer, max_competitors integer)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT p.max_sites, p.max_prompts, p.max_scans, p.max_competitors
  FROM public.profiles pr
  JOIN public.plans p ON p.name = pr.plan
  WHERE pr.id = user_id;
$function$;

-- Fix check_usage_limit function
CREATE OR REPLACE FUNCTION public.check_usage_limit(user_id uuid, limit_type text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $function$
  WITH limits AS (
    SELECT * FROM public.get_user_plan_limits(user_id)
  ),
  usage AS (
    SELECT * FROM public.usage_metrics WHERE usage_metrics.user_id = check_usage_limit.user_id
  )
  SELECT CASE limit_type
    WHEN 'scans' THEN usage.scan_count < COALESCE(limits.max_scans, 999999)
    WHEN 'prompts' THEN usage.prompt_count < COALESCE(limits.max_prompts, 999999)
    WHEN 'competitors' THEN usage.competitor_count < COALESCE(limits.max_competitors, 999999)
    WHEN 'sites' THEN (SELECT COUNT(*) FROM public.sites WHERE sites.user_id = check_usage_limit.user_id) < COALESCE(limits.max_sites, 999999)
    ELSE false
  END
  FROM limits, usage;
$function$;

-- Phase 3: Add audit logging for role changes
-- Create function to log role changes
CREATE OR REPLACE FUNCTION public.log_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  -- Only log if role actually changed
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    INSERT INTO public.audit_logs (
      user_id,
      action,
      table_name,
      record_id,
      old_values,
      new_values
    ) VALUES (
      auth.uid(),
      'role_change',
      'profiles',
      NEW.id,
      jsonb_build_object('role', OLD.role),
      jsonb_build_object('role', NEW.role)
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger for role change logging
DROP TRIGGER IF EXISTS log_profile_role_changes ON public.profiles;
CREATE TRIGGER log_profile_role_changes
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.log_role_change();

-- Phase 4: Ensure proper RLS on all sensitive tables
-- Add missing RLS policies if needed

-- Ensure dashboard_configs has proper admin-only update restriction
DROP POLICY IF EXISTS "Admins can manage dashboard configs" ON public.dashboard_configs;
CREATE POLICY "Admins can manage dashboard configs" 
ON public.dashboard_configs 
FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Ensure feature_flags has proper admin management
DROP POLICY IF EXISTS "Admins can manage all feature flags" ON public.feature_flags;
CREATE POLICY "Admins can manage all feature flags" 
ON public.feature_flags 
FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Add policy to prevent users from modifying usage_metrics beyond their limits
DROP POLICY IF EXISTS "Users can update their own usage metrics" ON public.usage_metrics;
CREATE POLICY "Users can update their own usage metrics" 
ON public.usage_metrics 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id AND
  -- Prevent users from decreasing their usage counts (only system should do this)
  scan_count >= (SELECT scan_count FROM public.usage_metrics WHERE user_id = auth.uid()) AND
  prompt_count >= (SELECT prompt_count FROM public.usage_metrics WHERE user_id = auth.uid()) AND
  competitor_count >= (SELECT competitor_count FROM public.usage_metrics WHERE user_id = auth.uid()) AND
  report_count >= (SELECT report_count FROM public.usage_metrics WHERE user_id = auth.uid())
);