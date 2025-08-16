import { withAdminGuard } from '@/components/auth/withRoleGuard';
import { useEffect } from 'react';
import { AdminSubNav } from '@/components/admin/AdminSubNav';
import { UsersTab } from '@/components/admin/UsersTab';
import { UsageTab } from '@/components/admin/UsageTab';
import { ReportsTab } from '@/components/admin/ReportsTab';
import { DashboardConfigTab } from '@/components/admin/DashboardConfigTab';
import { AuditLogsTab } from '@/components/admin/AuditLogsTab';
import { BillingTab } from '@/components/admin/BillingTab';
import { useSearchParams } from 'react-router-dom';
import { SEO } from '@/components/SEO';

function AdminPage() {
  const [params] = useSearchParams();
  const tab = params.get('tab') || 'users';

  useEffect(() => {
    document.title = 'Admin – FindableAI';
  }, []);

  return (
    <>
      <SEO
        title="Admin Panel"
        description="Manage users, usage, reports, dashboard configuration, audit logs and billing"
        noindex
      />
      
      <div className="space-y-6">
        <header>
          <h1 className="text-3xl font-bold text-foreground">Admin Panel</h1>
          <p className="text-muted-foreground">Manage users, usage, reports, features, logs and billing</p>
        </header>

      <AdminSubNav />

      <main>
        {tab === 'users' && <UsersTab />}
        {tab === 'usage' && <UsageTab />}
        {tab === 'reports' && <ReportsTab />}
        {tab === 'dashboard' && <DashboardConfigTab />}
        {tab === 'logs' && <AuditLogsTab />}
        {tab === 'billing' && <BillingTab />}
      </main>
      </div>
    </>
  );
}

export default withAdminGuard(AdminPage);