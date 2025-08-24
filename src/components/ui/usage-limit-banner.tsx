import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { X, TrendingUp, Zap, Users, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UsageStatus {
  type: 'scan' | 'prompt' | 'competitor' | 'report';
  current: number;
  limit: number;
  percentage: number;
  isNearLimit: boolean;
  isAtLimit: boolean;
}

interface UsageLimitBannerProps {
  warnings: UsageStatus[];
  className?: string;
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'scan': return <Search className="h-4 w-4" />;
    case 'prompt': return <Zap className="h-4 w-4" />;
    case 'competitor': return <Users className="h-4 w-4" />;
    case 'report': return <TrendingUp className="h-4 w-4" />;
    default: return <TrendingUp className="h-4 w-4" />;
  }
};

const getTypeLabel = (type: string) => {
  switch (type) {
    case 'scan': return 'website scans';
    case 'prompt': return 'AI tests';
    case 'competitor': return 'competitors';
    case 'report': return 'reports';
    default: return type;
  }
};

export function UsageLimitBanner({ warnings, className }: UsageLimitBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const navigate = useNavigate();

  if (dismissed || warnings.length === 0) return null;

  const handleUpgrade = () => {
    navigate('/pricing');
  };

  return (
    <Alert className={cn(
      "border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 mb-6",
      className
    )}>
      <TrendingUp className="h-4 w-4 text-amber-600" />
      <div className="flex items-start justify-between w-full">
        <div className="flex-1 pr-4">
          <AlertDescription className="text-amber-800 dark:text-amber-200">
            <div className="font-medium mb-2">
              You're approaching your usage limits
            </div>
            <div className="space-y-3">
              {warnings.map((warning) => (
                <div key={warning.type} className="flex items-center gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    {getTypeIcon(warning.type)}
                    <span className="text-sm font-medium">
                      {getTypeLabel(warning.type)}:
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-1">
                    <Progress 
                      value={warning.percentage} 
                      className="flex-1 h-2 max-w-24"
                    />
                    <span className="text-sm whitespace-nowrap">
                      {warning.current}/{warning.limit}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </AlertDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleUpgrade}
            size="sm"
            className="bg-gradient-to-r from-primary to-primary-glow hover:from-primary-hover hover:to-primary text-primary-foreground shadow-sm"
          >
            See Plans
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDismissed(true)}
            className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/20"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Alert>
  );
}