export default function Reports() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Reports</h1>
        <p className="text-muted-foreground">
          Generate and download comprehensive AI findability reports
        </p>
      </div>
      
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <h3 className="text-lg font-semibold text-card-foreground mb-2">
          No reports generated yet
        </h3>
        <p className="text-muted-foreground">
          Generate your first report to get actionable insights and recommendations
        </p>
      </div>
    </div>
  );
}