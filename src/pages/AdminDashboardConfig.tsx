import { useState, useEffect } from 'react';
import { withAdminGuard } from '@/components/auth/withRoleGuard';
import { SEO } from '@/components/SEO';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Eye, Save, Settings, Users, BarChart3, FileText, Target, Zap } from 'lucide-react';

type Role = 'user' | 'manager' | 'admin';
type Plan = 'free' | 'pro' | 'growth' | 'enterprise';

interface DashboardModule {
  key: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  category: 'core' | 'analytics' | 'tools' | 'reports';
}

interface DashboardConfig {
  id?: string;
  role: Role;
  plan: Plan;
  config: {
    modules: Record<string, boolean>;
    layout: string;
    theme: string;
  };
}

const availableModules: DashboardModule[] = [
  {
    key: 'overview_stats',
    name: 'Overview Statistics',
    description: 'Key metrics and performance indicators',
    icon: BarChart3,
    category: 'core'
  },
  {
    key: 'recent_scans',
    name: 'Recent Scans',
    description: 'Latest website scans and results',
    icon: Target,
    category: 'core'
  },
  {
    key: 'usage_meters',
    name: 'Usage Meters',
    description: 'Plan limits and current usage',
    icon: Zap,
    category: 'core'
  },
  {
    key: 'ai_tests',
    name: 'AI Test Results',
    description: 'Recent prompt simulation results',
    icon: Settings,
    category: 'tools'
  },
  {
    key: 'competitor_chart',
    name: 'Competitor Comparison',
    description: 'Compare scores with competitors',
    icon: Users,
    category: 'analytics'
  },
  {
    key: 'reports_panel',
    name: 'Reports Panel',
    description: 'Generate and download reports',
    icon: FileText,
    category: 'reports'
  },
  {
    key: 'optimization_tips',
    name: 'Optimization Tips',
    description: 'Actionable improvement suggestions',
    icon: Target,
    category: 'tools'
  },
  {
    key: 'team_usage',
    name: 'Team Usage (Manager+)',
    description: 'Team-wide usage statistics',
    icon: Users,
    category: 'analytics'
  }
];

const defaultConfig: DashboardConfig['config'] = {
  modules: {
    overview_stats: true,
    recent_scans: true,
    usage_meters: true,
    ai_tests: false,
    competitor_chart: false,
    reports_panel: false,
    optimization_tips: true,
    team_usage: false
  },
  layout: 'grid',
  theme: 'default'
};

function AdminDashboardConfigPage() {
  const [selectedRole, setSelectedRole] = useState<Role>('user');
  const [selectedPlan, setSelectedPlan] = useState<Plan>('free');
  const [config, setConfig] = useState<DashboardConfig['config']>(defaultConfig);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [configs, setConfigs] = useState<DashboardConfig[]>([]);
  const { toast } = useToast();

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('dashboard_configs')
        .select('*')
        .order('role', { ascending: true });

      if (error) throw error;

      const formattedConfigs = data?.map((item: any) => ({
        id: item.id,
        role: item.role as Role,
        plan: item.plan as Plan,
        config: item.config || defaultConfig
      })) || [];

      setConfigs(formattedConfigs);

      // Load config for current selection
      const currentConfig = formattedConfigs.find(
        c => c.role === selectedRole && c.plan === selectedPlan
      );
      
      if (currentConfig) {
        setConfig(currentConfig.config);
      } else {
        setConfig(defaultConfig);
      }
    } catch (error) {
      console.error('Error fetching configs:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch dashboard configurations',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  useEffect(() => {
    // Update config when role/plan changes
    const currentConfig = configs.find(
      c => c.role === selectedRole && c.plan === selectedPlan
    );
    
    if (currentConfig) {
      setConfig(currentConfig.config);
    } else {
      setConfig(defaultConfig);
    }
  }, [selectedRole, selectedPlan, configs]);

  const handleModuleToggle = (moduleKey: string, enabled: boolean) => {
    setConfig(prev => ({
      ...prev,
      modules: {
        ...prev.modules,
        [moduleKey]: enabled
      }
    }));
  };

  const saveConfiguration = async () => {
    setSaving(true);
    try {
      const existingConfig = configs.find(
        c => c.role === selectedRole && c.plan === selectedPlan
      );

      if (existingConfig) {
        // Update existing config
        const { error } = await supabase
          .from('dashboard_configs')
          .update({ config })
          .eq('id', existingConfig.id);

        if (error) throw error;
      } else {
        // Create new config
        const { error } = await supabase
          .from('dashboard_configs')
          .insert([{
            role: selectedRole,
            plan: selectedPlan,
            config
          }]);

        if (error) throw error;
      }

      toast({
        title: 'Success',
        description: 'Dashboard configuration saved successfully',
      });

      fetchConfigs(); // Refresh configs
    } catch (error) {
      console.error('Error saving config:', error);
      toast({
        title: 'Error',
        description: 'Failed to save configuration',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const getModulesByCategory = (category: string) => {
    return availableModules.filter(module => module.category === category);
  };

  const getEnabledModulesCount = () => {
    return Object.values(config.modules).filter(Boolean).length;
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Admin",
        "item": "/admin"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Dashboard Configuration",
        "item": "/admin/dashboard-config"
      }
    ]
  };

  return (
    <>
      <SEO
        title="Dashboard Configuration - Admin Panel"
        description="Configure dashboard modules and widgets for different user roles and plans"
        noindex
      />
      
      <script type="application/ld+json">
        {JSON.stringify(breadcrumbJsonLd)}
      </script>

      <div className="space-y-6">
        <header>
          <h1 className="text-3xl font-bold text-foreground">Dashboard Configuration</h1>
          <p className="text-muted-foreground">
            Configure dashboard modules and widgets for different user roles and subscription plans
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Configuration Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Role and Plan Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Target Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="role-select">User Role</Label>
                    <Select value={selectedRole} onValueChange={(value: Role) => setSelectedRole(value)}>
                      <SelectTrigger id="role-select">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="plan-select">Subscription Plan</Label>
                    <Select value={selectedPlan} onValueChange={(value: Plan) => setSelectedPlan(value)}>
                      <SelectTrigger id="plan-select">
                        <SelectValue placeholder="Select plan" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="pro">Pro</SelectItem>
                        <SelectItem value="growth">Growth</SelectItem>
                        <SelectItem value="enterprise">Enterprise</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize">{selectedRole}</Badge>
                    <Badge variant="secondary" className="capitalize">{selectedPlan}</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {getEnabledModulesCount()} modules enabled
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Module Configuration */}
            {loading ? (
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-48" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-48" />
                        </div>
                        <Skeleton className="h-6 w-10" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              ['core', 'analytics', 'tools', 'reports'].map(category => (
                <Card key={category}>
                  <CardHeader>
                    <CardTitle className="capitalize">{category} Modules</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {getModulesByCategory(category).map(module => {
                      const IconComponent = module.icon;
                      return (
                        <div key={module.key} className="flex items-center justify-between">
                          <div className="flex items-start gap-3">
                            <IconComponent className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div className="space-y-1">
                              <Label htmlFor={module.key} className="text-sm font-medium">
                                {module.name}
                              </Label>
                              <p className="text-xs text-muted-foreground">
                                {module.description}
                              </p>
                            </div>
                          </div>
                          <Switch
                            id={module.key}
                            checked={config.modules[module.key] || false}
                            onCheckedChange={(checked) => handleModuleToggle(module.key, checked)}
                          />
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              ))
            )}

            {/* Save Button */}
            <div className="flex justify-end">
              <Button
                onClick={saveConfiguration}
                disabled={saving}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save Configuration'}
              </Button>
            </div>
          </div>

          {/* Live Preview */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Live Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg p-4 bg-muted/30 space-y-3">
                  <div className="text-xs font-medium text-muted-foreground mb-2">
                    Dashboard for {selectedRole} ({selectedPlan})
                  </div>
                  
                  {Object.entries(config.modules)
                    .filter(([_, enabled]) => enabled)
                    .map(([moduleKey]) => {
                      const module = availableModules.find(m => m.key === moduleKey);
                      if (!module) return null;
                      
                      const IconComponent = module.icon;
                      return (
                        <div
                          key={moduleKey}
                          className="flex items-center gap-2 p-2 bg-card rounded border text-xs"
                        >
                          <IconComponent className="h-3 w-3 text-muted-foreground" />
                          <span className="font-medium">{module.name}</span>
                        </div>
                      );
                    })}
                  
                  {getEnabledModulesCount() === 0 && (
                    <div className="text-center py-4 text-xs text-muted-foreground">
                      No modules enabled
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Configuration Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Configuration Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Modules:</span>
                  <span className="font-medium">{availableModules.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Enabled:</span>
                  <span className="font-medium text-success">{getEnabledModulesCount()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Disabled:</span>
                  <span className="font-medium text-muted-foreground">
                    {availableModules.length - getEnabledModulesCount()}
                  </span>
                </div>
                
                <div className="pt-2 border-t">
                  <div className="text-xs text-muted-foreground">
                    Configuration applies to all {selectedRole} users on {selectedPlan} plan
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}

export default withAdminGuard(AdminDashboardConfigPage);