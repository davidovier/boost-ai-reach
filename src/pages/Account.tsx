export default function Account() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Account Settings</h1>
        <p className="text-muted-foreground">
          Manage your profile, subscription, and preferences
        </p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="text-lg font-semibold text-card-foreground mb-4">
            Profile Information
          </h3>
          <p className="text-muted-foreground">
            Update your account details and preferences
          </p>
        </div>
        
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="text-lg font-semibold text-card-foreground mb-4">
            Subscription & Billing
          </h3>
          <p className="text-muted-foreground">
            Manage your plan and billing information
          </p>
        </div>
      </div>
    </div>
  );
}