export default function Scans() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Website Scans</h1>
        <p className="text-muted-foreground">
          Analyze your websites for AI findability optimization
        </p>
      </div>
      
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <h3 className="text-lg font-semibold text-card-foreground mb-2">
          No scans yet
        </h3>
        <p className="text-muted-foreground">
          Add your first website to start analyzing its AI findability score
        </p>
      </div>
    </div>
  );
}