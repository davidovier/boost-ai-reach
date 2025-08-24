import { withAdminGuard } from '@/components/auth/withRoleGuard';
import { useEffect } from 'react';
import { AdminSubNav } from '@/components/admin/AdminSubNav';
import { UsersTab } from '@/components/admin/UsersTab';
import { UsageTab } from '@/components/admin/UsageTab';
import { ReportsTab } from '@/components/admin/ReportsTab';
import { DashboardConfigTab } from '@/components/admin/DashboardConfigTab';
import { AuditLogsTab } from '@/components/admin/AuditLogsTab';
import { BillingTab } from '@/components/admin/BillingTab';
import { useSearchParams, Link } from 'react-router-dom';
import { SEO } from '@/components/SEO';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Home, Settings } from 'lucide-react';
import { SkipLink } from '@/components/ui/skip-link';
import { PageErrorBoundary, ComponentErrorBoundary } from '@/components/ErrorBoundary';

function AdminPage() {
  const [params] = useSearchParams();
  const tab = params.get('tab') || 'users';

  const getTabDisplayName = (tabKey: string) => {
    const tabMap: Record<string, string> = {
      users: 'Users',
      usage: 'Usage',
      reports: 'Reports',
      dashboard: 'Dashboard Config',
      logs: 'Audit Logs',
      billing: 'Billing'
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
        title="Admin Panel - FindableAI"
        description="Administrative panel for managing users, usage, reports, dashboard configuration, audit logs and billing."
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
              {tab === 'billing' && <BillingTab />}
            </ComponentErrorBoundary>
          </div>
        </main>
      </div>
    </PageErrorBoundary>
  );
}

export default withAdminGuard(AdminPage);