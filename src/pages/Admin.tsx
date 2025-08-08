import { withAdminGuard } from '@/components/auth/withRoleGuard';

function AdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Admin Panel</h1>
        <p className="text-muted-foreground">
          Manage users, monitor usage, and configure system settings
        </p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="text-lg font-semibold text-card-foreground mb-4">
            User Management
          </h3>
          <p className="text-muted-foreground">
            View and manage user accounts, roles, and permissions
          </p>
        </div>
        
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="text-lg font-semibold text-card-foreground mb-4">
            Usage Monitoring
          </h3>
          <p className="text-muted-foreground">
            Monitor system usage, quotas, and performance metrics
          </p>
        </div>
        
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="text-lg font-semibold text-card-foreground mb-4">
            System Configuration
          </h3>
          <p className="text-muted-foreground">
            Configure dashboard layouts, feature flags, and system settings
          </p>
        </div>
      </div>
    </div>
  );
}

export default withAdminGuard(AdminPage);