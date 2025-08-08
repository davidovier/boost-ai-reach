export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your AI findability optimization
        </p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="font-semibold text-card-foreground">Sites Tracked</h3>
          <p className="text-2xl font-bold text-primary">0</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="font-semibold text-card-foreground">Scans This Month</h3>
          <p className="text-2xl font-bold text-primary">0</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="font-semibold text-card-foreground">AI Tests Run</h3>
          <p className="text-2xl font-bold text-primary">0</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="font-semibold text-card-foreground">Avg. Score</h3>
          <p className="text-2xl font-bold text-primary">-</p>
        </div>
      </div>
    </div>
  );
}