-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enums for consistent values
CREATE TYPE app_role AS ENUM ('user', 'manager', 'admin');
CREATE TYPE subscription_plan AS ENUM ('free', 'pro', 'growth', 'enterprise');
CREATE TYPE tip_severity AS ENUM ('low', 'medium', 'high');
CREATE TYPE tip_status AS ENUM ('todo', 'done');
CREATE TYPE subscription_status AS ENUM ('active', 'canceled', 'past_due', 'unpaid', 'trialing');

-- Create profiles table that extends auth.users
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  role app_role NOT NULL DEFAULT 'user',
  plan subscription_plan NOT NULL DEFAULT 'free',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create plans table
CREATE TABLE public.plans (
  id SERIAL PRIMARY KEY,
  name subscription_plan UNIQUE NOT NULL,
  price INTEGER,
  max_sites INTEGER,
  max_prompts INTEGER,
  max_scans INTEGER,
  max_competitors INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create sites table
CREATE TABLE public.sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create scans table
CREATE TABLE public.scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  scan_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB,
  schema_data JSONB,
  performance JSONB,
  crawlability_score INTEGER CHECK (crawlability_score >= 0 AND crawlability_score <= 100),
  summarizability_score INTEGER CHECK (summarizability_score >= 0 AND summarizability_score <= 100),
  ai_findability_score INTEGER CHECK (ai_findability_score >= 0 AND ai_findability_score <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create prompt_simulations table
CREATE TABLE public.prompt_simulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  result JSONB,
  includes_user_site BOOLEAN,
  run_date TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create competitors table
CREATE TABLE public.competitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create competitor_snapshots table
CREATE TABLE public.competitor_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_id UUID NOT NULL REFERENCES public.competitors(id) ON DELETE CASCADE,
  snapshot_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ai_findability_score INTEGER CHECK (ai_findability_score >= 0 AND ai_findability_score <= 100),
  metadata JSONB,
  schema_data JSONB
);

-- Create reports table
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  site_id UUID REFERENCES public.sites(id) ON DELETE SET NULL,
  period_start DATE,
  period_end DATE,
  pdf_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create tips table
CREATE TABLE public.tips (
  id SERIAL PRIMARY KEY,
  scan_id UUID NOT NULL REFERENCES public.scans(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  severity tip_severity NOT NULL DEFAULT 'medium',
  status tip_status NOT NULL DEFAULT 'todo',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create dashboard_configs table
CREATE TABLE public.dashboard_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role app_role,
  plan subscription_plan,
  config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(role, plan)
);

-- Create feature_flags table
CREATE TABLE public.feature_flags (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  feature_key TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, feature_key)
);

-- Create subscriptions table (Stripe integration)
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT UNIQUE,
  plan subscription_plan NOT NULL,
  status subscription_status NOT NULL,
  started_at TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create usage_metrics table for tracking plan limits
CREATE TABLE public.usage_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scan_count INTEGER NOT NULL DEFAULT 0,
  prompt_count INTEGER NOT NULL DEFAULT 0,
  competitor_count INTEGER NOT NULL DEFAULT 0,
  report_count INTEGER NOT NULL DEFAULT 0,
  last_reset TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create audit_logs table for tracking sensitive operations
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  table_name TEXT,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default plans
INSERT INTO public.plans (name, price, max_sites, max_prompts, max_scans, max_competitors) VALUES
  ('free', 0, 1, 1, 1, 0),
  ('pro', 2900, 3, 10, 4, 1),
  ('growth', 9900, 10, 50, 30, 5),
  ('enterprise', NULL, NULL, NULL, NULL, NULL);

-- Insert default dashboard configs
INSERT INTO public.dashboard_configs (role, plan, config) VALUES
  ('user', 'free', '{"widgets": ["scan_summary", "ai_tests"], "features": ["basic_scanning"]}'),
  ('user', 'pro', '{"widgets": ["scan_summary", "ai_tests", "competitors"], "features": ["basic_scanning", "competitor_tracking"]}'),
  ('user', 'growth', '{"widgets": ["scan_summary", "ai_tests", "competitors", "reports"], "features": ["basic_scanning", "competitor_tracking", "advanced_reports"]}'),
  ('manager', 'free', '{"widgets": ["scan_summary", "ai_tests", "team_usage"], "features": ["basic_scanning", "team_overview"]}'),
  ('admin', NULL, '{"widgets": ["scan_summary", "ai_tests", "competitors", "reports", "user_management", "admin_controls"], "features": ["all"]}');

-- Create indexes for performance
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_sites_user_id ON public.sites(user_id);
CREATE INDEX idx_scans_site_id ON public.scans(site_id);
CREATE INDEX idx_scans_scan_date ON public.scans(scan_date);
CREATE INDEX idx_prompt_simulations_user_id ON public.prompt_simulations(user_id);
CREATE INDEX idx_prompt_simulations_run_date ON public.prompt_simulations(run_date);
CREATE INDEX idx_competitors_user_id ON public.competitors(user_id);
CREATE INDEX idx_competitor_snapshots_competitor_id ON public.competitor_snapshots(competitor_id);
CREATE INDEX idx_competitor_snapshots_snapshot_date ON public.competitor_snapshots(snapshot_date);
CREATE INDEX idx_reports_user_id ON public.reports(user_id);
CREATE INDEX idx_reports_site_id ON public.reports(site_id);
CREATE INDEX idx_tips_scan_id ON public.tips(scan_id);
CREATE INDEX idx_tips_status ON public.tips(status);
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_customer_id ON public.subscriptions(stripe_customer_id);
CREATE INDEX idx_usage_metrics_user_id ON public.usage_metrics(user_id);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at);

-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitor_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboard_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
-- Plans table is public readable

-- Create security definer functions to avoid RLS recursion
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS app_role
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM public.profiles WHERE id = user_id;
$$;

CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT public.get_user_role(user_id) = 'admin';
$$;

CREATE OR REPLACE FUNCTION public.is_manager_or_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT public.get_user_role(user_id) IN ('manager', 'admin');
$$;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Profiles can be inserted"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create RLS policies for sites
CREATE POLICY "Users can manage their own sites"
  ON public.sites FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all sites"
  ON public.sites FOR SELECT
  USING (public.is_admin(auth.uid()));

-- Create RLS policies for scans
CREATE POLICY "Users can view scans of their sites"
  ON public.scans FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sites 
      WHERE sites.id = scans.site_id 
      AND sites.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create scans for their sites"
  ON public.scans FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sites 
      WHERE sites.id = scans.site_id 
      AND sites.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all scans"
  ON public.scans FOR SELECT
  USING (public.is_admin(auth.uid()));

-- Create RLS policies for prompt_simulations
CREATE POLICY "Users can manage their own prompt simulations"
  ON public.prompt_simulations FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all prompt simulations"
  ON public.prompt_simulations FOR SELECT
  USING (public.is_admin(auth.uid()));

-- Create RLS policies for competitors
CREATE POLICY "Users can manage their own competitors"
  ON public.competitors FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all competitors"
  ON public.competitors FOR SELECT
  USING (public.is_admin(auth.uid()));

-- Create RLS policies for competitor_snapshots
CREATE POLICY "Users can view snapshots of their competitors"
  ON public.competitor_snapshots FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.competitors 
      WHERE competitors.id = competitor_snapshots.competitor_id 
      AND competitors.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create snapshots for their competitors"
  ON public.competitor_snapshots FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.competitors 
      WHERE competitors.id = competitor_snapshots.competitor_id 
      AND competitors.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all competitor snapshots"
  ON public.competitor_snapshots FOR SELECT
  USING (public.is_admin(auth.uid()));

-- Create RLS policies for reports
CREATE POLICY "Users can manage their own reports"
  ON public.reports FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all reports"
  ON public.reports FOR SELECT
  USING (public.is_admin(auth.uid()));

-- Create RLS policies for tips
CREATE POLICY "Users can view tips for their scans"
  ON public.tips FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.scans 
      JOIN public.sites ON sites.id = scans.site_id
      WHERE scans.id = tips.scan_id 
      AND sites.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update tips for their scans"
  ON public.tips FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.scans 
      JOIN public.sites ON sites.id = scans.site_id
      WHERE scans.id = tips.scan_id 
      AND sites.user_id = auth.uid()
    )
  );

CREATE POLICY "Tips can be inserted"
  ON public.tips FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all tips"
  ON public.tips FOR SELECT
  USING (public.is_admin(auth.uid()));

-- Create RLS policies for dashboard_configs
CREATE POLICY "Anyone can view dashboard configs"
  ON public.dashboard_configs FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage dashboard configs"
  ON public.dashboard_configs FOR ALL
  USING (public.is_admin(auth.uid()));

-- Create RLS policies for feature_flags
CREATE POLICY "Users can view their own feature flags"
  ON public.feature_flags FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Admins can manage all feature flags"
  ON public.feature_flags FOR ALL
  USING (public.is_admin(auth.uid()));

-- Create RLS policies for subscriptions
CREATE POLICY "Users can view their own subscriptions"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions"
  ON public.subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Subscriptions can be inserted"
  ON public.subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all subscriptions"
  ON public.subscriptions FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage all subscriptions"
  ON public.subscriptions FOR ALL
  USING (public.is_admin(auth.uid()));

-- Create RLS policies for usage_metrics
CREATE POLICY "Users can view their own usage metrics"
  ON public.usage_metrics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own usage metrics"
  ON public.usage_metrics FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usage metrics can be inserted"
  ON public.usage_metrics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Managers can view team usage metrics"
  ON public.usage_metrics FOR SELECT
  USING (public.is_manager_or_admin(auth.uid()));

CREATE POLICY "Admins can manage all usage metrics"
  ON public.usage_metrics FOR ALL
  USING (public.is_admin(auth.uid()));

-- Create RLS policies for audit_logs
CREATE POLICY "Admins can view all audit logs"
  ON public.audit_logs FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Audit logs can be inserted"
  ON public.audit_logs FOR INSERT
  WITH CHECK (true);

-- Make plans table publicly readable
CREATE POLICY "Anyone can view plans"
  ON public.plans FOR SELECT
  USING (true);

-- Create function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Create trigger for automatic profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sites_updated_at
  BEFORE UPDATE ON public.sites
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_competitors_updated_at
  BEFORE UPDATE ON public.competitors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tips_updated_at
  BEFORE UPDATE ON public.tips
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_dashboard_configs_updated_at
  BEFORE UPDATE ON public.dashboard_configs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_feature_flags_updated_at
  BEFORE UPDATE ON public.feature_flags
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_usage_metrics_updated_at
  BEFORE UPDATE ON public.usage_metrics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create helper functions for usage tracking
CREATE OR REPLACE FUNCTION public.get_user_plan_limits(user_id UUID)
RETURNS TABLE (
  max_sites INTEGER,
  max_prompts INTEGER,
  max_scans INTEGER,
  max_competitors INTEGER
)
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT p.max_sites, p.max_prompts, p.max_scans, p.max_competitors
  FROM public.profiles pr
  JOIN public.plans p ON p.name = pr.plan
  WHERE pr.id = user_id;
$$;

CREATE OR REPLACE FUNCTION public.check_usage_limit(
  user_id UUID,
  limit_type TEXT
)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
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
$$;