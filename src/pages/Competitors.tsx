export default function Competitors() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Competitors</h1>
        <p className="text-muted-foreground">
          Track and compare your competitors' AI findability scores
        </p>
      </div>
      
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <h3 className="text-lg font-semibold text-card-foreground mb-2">
          No competitors added yet
        </h3>
        <p className="text-muted-foreground">
          Add competitor domains to track their AI visibility compared to yours
        </p>
      </div>
    </div>
  );
}