-- Fix security linter issues

-- Enable RLS on any tables that might be missing it
-- (The linter detected tables with policies but RLS disabled)

-- Check and enable RLS on all public tables
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

-- Fix the update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;