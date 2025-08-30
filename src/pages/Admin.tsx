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
    return tabMap[tabKey] || 'Users';
  };

  useEffect(() => {
    document.title = 'Admin – FindableAI';
  }, []);

  return (
    <PageErrorBoundary context="Admin Panel">
      <SkipLink href="#main-content">Skip to main content</SkipLink>
      
      <SEO 
        title="Admin Panel"
        description="Administrative panel for managing users, usage analytics, reports, dashboard configuration, audit logs and billing."
        url="/admin"
        noindex={true}
      />
      
      <div className="space-y-6 admin-mobile">
        {/* Enhanced Breadcrumb Navigation */}
        <div className="admin-breadcrumb-container">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/dashboard" className="flex items-center gap-1 focus-enhanced">
                    <Home className="w-4 h-4" />
                    <span className="sr-only sm:not-sr-only">Home</span>
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/admin" className="flex items-center gap-1 focus-enhanced">
                    <Settings className="w-4 h-4" />
                    Admin
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="font-medium text-primary">
                  {getTabDisplayName(tab)}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Header with premium styling */}
        <header className="admin-header text-mobile">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground heading-responsive">Admin Panel</h1>
            <p className="text-muted-foreground text-responsive">
              Manage users, usage, reports, features, logs and billing
            </p>
          </div>
        </header>

        {/* Navigation with enhanced styling */}
        <div className="admin-nav-container">
          <AdminSubNav />
        </div>

        {/* Main content with premium card styling */}
        <main id="main-content" className="admin-main" role="main">
          <div className="admin-content-card">
            <ComponentErrorBoundary context={`Admin ${getTabDisplayName(tab)} Tab`}>
              {tab === 'users' && <UsersTab />}
              {tab === 'usage' && <UsageTab />}
              {tab === 'reports' && <ReportsTab />}
              {tab === 'dashboard' && <DashboardConfigTab />}
              {tab === 'logs' && <AuditLogsTab />}
              {tab === 'security' && <SecurityTab />}
              {tab === 'billing' && <BillingTab />}
              {tab === 'ab-tests' && <ABTestAnalytics />}
              {tab === 'referrals' && <ReferralAnalytics />}
            </ComponentErrorBoundary>
          </div>
        </main>
      </div>
    </PageErrorBoundary>
  );
}

export default withAdminGuard(AdminPage);