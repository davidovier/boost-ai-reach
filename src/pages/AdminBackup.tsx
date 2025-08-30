import { useState, useEffect } from 'react';
import { withAdminGuard } from '@/components/auth/withRoleGuard';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SEO } from '@/components/SEO';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { 
  Home,
  Settings,
  Users,
  BarChart3,
  FileText,
  Shield,
  CreditCard,
  Sliders,
  Activity,
  TestTube,
  UserCheck
} from 'lucide-react';
import { SkipLink } from '@/components/ui/skip-link';
import { PageErrorBoundary, ComponentErrorBoundary } from '@/components/ErrorBoundary';

// Import enhanced components
import { AdminOverview } from '@/components/admin/AdminOverview';
import { EnhancedUsersTab } from '@/components/admin/EnhancedUsersTab';

// Import existing admin components
import { UsageTab } from '@/components/admin/UsageTab';
import { ReportsTab } from '@/components/admin/ReportsTab';
import { DashboardConfigTab } from '@/components/admin/DashboardConfigTab';
import { AuditLogsTab } from '@/components/admin/AuditLogsTab';
import SecurityTab from '@/components/admin/SecurityTab';
import { BillingTab } from '@/components/admin/BillingTab';
import { ABTestAnalytics } from '@/components/admin/ABTestAnalytics';
import { ReferralAnalytics } from '@/components/admin/ReferralAnalytics';

function AdminPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const tab = params.get('tab') || 'overview';

  const tabConfig = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'usage', label: 'Usage', icon: BarChart3 },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'dashboard', label: 'Config', icon: Sliders },
    { id: 'logs', label: 'Logs', icon: Activity },
    { id: 'ab-tests', label: 'A/B Tests', icon: TestTube },
    { id: 'referrals', label: 'Referrals', icon: UserCheck }
  ];

  const getTabDisplayName = (tabKey: string) => {
    const tabMap: Record<string, string> = {
      overview: 'Overview',
      users: 'Users',
      usage: 'Usage',
      reports: 'Reports',
      dashboard: 'Dashboard Config',
      logs: 'Audit Logs',
      security: 'Security',
      billing: 'Billing',
      'ab-tests': 'A/B Tests',
      referrals: 'Referrals'
    };
    return tabMap[tabKey] || 'Overview';
  };

  const handleTabChange = (newTab: string) => {
    setParams({ tab: newTab });
  };

  const handleNavigateToTab = (targetTab: string) => {
    handleTabChange(targetTab);
  };

  useEffect(() => {
    document.title = `Admin - ${getTabDisplayName(tab)} - FindableAI`;
  }, [tab]);

  return (
    <PageErrorBoundary context="Admin Panel">
      <SkipLink href="#main-content">Skip to main content</SkipLink>
      
      <SEO 
        title={`Admin - ${getTabDisplayName(tab)}`}
        description="Administrative panel for managing users, usage analytics, reports, dashboard configuration, audit logs and billing."
        url={`/admin?tab=${tab}`}
        noindex={true}
      />
      
      <div className="space-y-6">
        <header>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard" className="flex items-center gap-1">
                  <Home className="h-4 w-4" />
                  Dashboard
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="flex items-center gap-1">
                  <Settings className="h-4 w-4" />
                  Admin
                </BreadcrumbPage>
              </BreadcrumbItem>
              {tab !== 'overview' && (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{getTabDisplayName(tab)}</BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              )}
            </BreadcrumbList>
          </Breadcrumb>
          
          <div className="mt-2">
            <h1 className="text-3xl font-bold text-foreground">Admin Panel</h1>
            <p className="text-muted-foreground">
              Manage users, monitor system health, and configure platform settings
            </p>
          </div>
        </header>

        <main id="main-content">
          <Tabs value={tab} onValueChange={handleTabChange} className="space-y-6">
            {/* Desktop Navigation */}
            <div className="hidden lg:block">
              <TabsList className="grid w-full grid-cols-10">
                {tabConfig.map((tabItem) => {
                  const Icon = tabItem.icon;
                  return (
                    <TabsTrigger
                      key={tabItem.id}
                      value={tabItem.id}
                      className="flex items-center gap-2 text-sm"
                    >
                      <Icon className="h-4 w-4" />
                      <span className="hidden xl:inline">{tabItem.label}</span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>

            {/* Tablet Navigation */}
            <div className="hidden md:block lg:hidden">
              <TabsList className="grid w-full grid-cols-5">
                {tabConfig.slice(0, 5).map((tabItem) => {
                  const Icon = tabItem.icon;
                  return (
                    <TabsTrigger
                      key={tabItem.id}
                      value={tabItem.id}
                      className="flex items-center gap-2"
                    >
                      <Icon className="h-4 w-4" />
                      <span className="hidden lg:inline">{tabItem.label}</span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
              <TabsList className="grid w-full grid-cols-5 mt-2">
                {tabConfig.slice(5).map((tabItem) => {
                  const Icon = tabItem.icon;
                  return (
                    <TabsTrigger
                      key={tabItem.id}
                      value={tabItem.id}
                      className="flex items-center gap-2"
                    >
                      <Icon className="h-4 w-4" />
                      <span className="hidden lg:inline">{tabItem.label}</span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>

            {/* Mobile Navigation - Scrollable */}
            <div className="md:hidden">
              <div className="overflow-x-auto">
                <TabsList className="flex w-max space-x-2 p-1">
                  {tabConfig.map((tabItem) => {
                    const Icon = tabItem.icon;
                    return (
                      <TabsTrigger
                        key={tabItem.id}
                        value={tabItem.id}
                        className="flex flex-col items-center gap-1 px-3 py-2 whitespace-nowrap"
                      >
                        <Icon className="h-4 w-4" />
                        <span className="text-xs">{tabItem.label}</span>
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
              </div>
            </div>

            {/* Tab Content */}
            <ComponentErrorBoundary context="Admin Overview">
              <TabsContent value="overview">
                <AdminOverview onNavigateToTab={handleNavigateToTab} />
              </TabsContent>
            </ComponentErrorBoundary>

            <ComponentErrorBoundary context="Enhanced Users Tab">
              <TabsContent value="users">
                <EnhancedUsersTab />
              </TabsContent>
            </ComponentErrorBoundary>

            <ComponentErrorBoundary context="Usage Analytics">
              <TabsContent value="usage">
                <UsageTab />
              </TabsContent>
            </ComponentErrorBoundary>

            <ComponentErrorBoundary context="Reports Management">
              <TabsContent value="reports">
                <ReportsTab />
              </TabsContent>
            </ComponentErrorBoundary>

            <ComponentErrorBoundary context="Security Monitoring">
              <TabsContent value="security">
                <SecurityTab />
              </TabsContent>
            </ComponentErrorBoundary>

            <ComponentErrorBoundary context="Billing Overview">
              <TabsContent value="billing">
                <BillingTab />
              </TabsContent>
            </ComponentErrorBoundary>

            <ComponentErrorBoundary context="Dashboard Configuration">
              <TabsContent value="dashboard">
                <DashboardConfigTab />
              </TabsContent>
            </ComponentErrorBoundary>

            <ComponentErrorBoundary context="Audit Logs">
              <TabsContent value="logs">
                <AuditLogsTab />
              </TabsContent>
            </ComponentErrorBoundary>

            <ComponentErrorBoundary context="A/B Test Analytics">
              <TabsContent value="ab-tests">
                <ABTestAnalytics />
              </TabsContent>
            </ComponentErrorBoundary>

            <ComponentErrorBoundary context="Referral Analytics">
              <TabsContent value="referrals">
                <ReferralAnalytics />
              </TabsContent>
            </ComponentErrorBoundary>
          </Tabs>
        </main>
      </div>
    </PageErrorBoundary>
  );
}

export default withAdminGuard(AdminPage);