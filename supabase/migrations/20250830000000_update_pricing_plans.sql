-- Update pricing plans from Free/Pro/Growth/Enterprise to Free/Pro/Max
-- This migration updates the plans table and existing user profiles

-- First, update the plans table with new structure
-- Remove old growth and enterprise plans
DELETE FROM public.plans WHERE name IN ('growth', 'enterprise');

-- Update existing plans and add new max plan
INSERT INTO public.plans (name, price, max_sites, max_prompts, max_scans, max_competitors) 
VALUES ('free', 0, 1, 1, 1, 0) 
ON CONFLICT (name) DO UPDATE SET
  max_sites = 1,
  max_prompts = 1,
  max_scans = 1,
  max_competitors = 0;

INSERT INTO public.plans (name, price, max_sites, max_prompts, max_scans, max_competitors) 
VALUES ('pro', 2900, 5, 25, 10, 3) 
ON CONFLICT (name) DO UPDATE SET
  price = 2900,
  max_sites = 5,
  max_prompts = 25,
  max_scans = 10,
  max_competitors = 3;

INSERT INTO public.plans (name, price, max_sites, max_prompts, max_scans, max_competitors) 
VALUES ('max', 9900, -1, -1, -1, -1) 
ON CONFLICT (name) DO UPDATE SET
  price = 9900,
  max_sites = -1,
  max_prompts = -1,
  max_scans = -1,
  max_competitors = -1;

-- Update existing user profiles
-- Move growth plan users to max plan
UPDATE public.profiles 
SET plan = 'max', updated_at = now() 
WHERE plan = 'growth';

-- Move enterprise plan users to max plan  
UPDATE public.profiles 
SET plan = 'max', updated_at = now() 
WHERE plan = 'enterprise';

-- Update user subscription statuses if needed
UPDATE public.profiles 
SET subscription_status = 'max', updated_at = now() 
WHERE subscription_status = 'growth';

UPDATE public.profiles 
SET subscription_status = 'max', updated_at = now() 
WHERE subscription_status = 'enterprise';