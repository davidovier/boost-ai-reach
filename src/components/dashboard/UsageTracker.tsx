import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { usePlanManagement } from "@/hooks/usePlanManagement";

interface UsageItem {
  label: string;
  current: number;
  max: number;
  icon: React.ReactNode;
  gradient: string;
}

interface UsageTrackerProps {
  items: UsageItem[];
  className?: string;
}

export function UsageTracker({ items, className }: UsageTrackerProps) {
  const { currentPlan, getNextPlan } = usePlanManagement();
  const nextPlan = getNextPlan();

  const getUsageStatus = (current: number, max: number) => {
    const percentage = max > 0 ? (current / max) * 100 : 0;
    
    if (percentage >= 90) return { status: 'critical', color: 'text-destructive' };
    if (percentage >= 75) return { status: 'warning', color: 'text-amber-600' };
    return { status: 'good', color: 'text-green-600' };
  };

  const formatPercentage = (current: number, max: number) => {
    return max > 0 ? Math.round((current / max) * 100) : 0;
  };

  const getUpgradeHint = (current: number, max: number) => {
    if (max === 0 || !nextPlan) return null;
    
    const percentage = (current / max) * 100;
    if (percentage >= 75) {
      return `Upgrade to ${nextPlan.name} for more capacity`;
    }
    return null;
  };

  return (
    <div className={cn("space-y-4", className)}>
      {items.map((item, index) => {
        const percentage = formatPercentage(item.current, item.max);
        const { status, color } = getUsageStatus(item.current, item.max);
        const upgradeHint = getUpgradeHint(item.current, item.max);
        
        return (
          <div 
            key={item.label}
            className="group relative p-4 rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-md transition-all duration-300 animate-fade-in"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-lg text-sm font-medium",
                  item.gradient
                )}>
                  {item.icon}
                </div>
                <div>
                  <p className="font-medium text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.current} of {item.max} used
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={cn("text-xs font-mono", color)}>
                  {percentage}%
                </Badge>
              </div>
            </div>
            
            <div className="space-y-2">
              <Progress 
                value={percentage} 
                className="h-2 bg-secondary/50"
              />
              
              {/* Visual indicators */}
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0</span>
                <span className="font-medium">{item.max}</span>
              </div>

              {/* Upgrade hint */}
              {upgradeHint && (
                <p className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                  💡 {upgradeHint}
                </p>
              )}
            </div>
            
            {/* Status indicator */}
            <div className={cn(
              "absolute top-2 right-2 w-2 h-2 rounded-full transition-colors",
              status === 'critical' ? 'bg-destructive' : 
              status === 'warning' ? 'bg-amber-500' : 'bg-green-500'
            )} />
          </div>
        );
      })}
    </div>
  );
}