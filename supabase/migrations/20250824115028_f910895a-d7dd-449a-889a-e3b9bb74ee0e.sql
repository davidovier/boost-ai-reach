-- Ensure plans table has proper limits for Free plan (1 scan/month)
-- Update or insert the free plan with scan limit of 1
INSERT INTO public.plans (name, price, max_sites, max_prompts, max_scans, max_competitors) 
VALUES ('free', 0, 1, 1, 1, 0) 
ON CONFLICT (name) DO UPDATE SET
  max_scans = 1,
  max_prompts = 1,
  max_sites = 1,
  max_competitors = 0;

-- Update other plans for clarity
INSERT INTO public.plans (name, price, max_sites, max_prompts, max_scans, max_competitors) 
VALUES ('pro', 2900, 3, 10, 4, 1) 
ON CONFLICT (name) DO UPDATE SET
  price = 2900,
  max_sites = 3,
  max_prompts = 10,
  max_scans = 4,
  max_competitors = 1;

INSERT INTO public.plans (name, price, max_sites, max_prompts, max_scans, max_competitors) 
VALUES ('growth', 9900, 10, 50, 30, 5) 
ON CONFLICT (name) DO UPDATE SET
  price = 9900,
  max_sites = 10,
  max_prompts = 50,
  max_scans = 30,
  max_competitors = 5;

INSERT INTO public.plans (name, price, max_sites, max_prompts, max_scans, max_competitors) 
VALUES ('enterprise', 19900, 100, 200, 100, 20) 
ON CONFLICT (name) DO UPDATE SET
  price = 19900,
  max_sites = 100,
  max_prompts = 200,
  max_scans = 100,
  max_competitors = 20;