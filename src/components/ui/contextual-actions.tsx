import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useUsageLimits } from '@/hooks/useUsageLimits';
import { 
  Plus, 
  Search, 
  Bot, 
  Users, 
  FileText, 
  Globe,
  TrendingUp,
  Zap,
  Crown
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ContextualAction {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  variant?: 'default' | 'outline' | 'secondary';
  requiresPlan?: string[];
  priority: number;
}

interface ContextualActionsProps {
  context: 'dashboard' | 'scans' | 'ai-tests' | 'competitors' | 'reports';
  currentData?: any; // Context-specific data
  className?: string;
}

export function ContextualActions({ context, currentData, className = '' }: ContextualActionsProps) {
  const { profile } = useAuth();
  const { getReachedLimits, canUseFeature } = useUsageLimits();
  const navigate = useNavigate();
  const userPlan = profile?.plan || 'free';

  const baseActions: Record<string, ContextualAction[]> = {
    dashboard: [
      {
        id: 'add-website',
        title: 'Add Website',
        description: 'Add a new website to analyze',
        icon: Plus,
        action: () => {
          navigate('/dashboard#websites');
          setTimeout(() => {
            const input = document.querySelector('input[placeholder*="website"]') as HTMLInputElement;
            if (input) input.focus();
          }, 100);
        },
        priority: 1
      },
      {
        id: 'run-scan',
        title: 'Run Quick Scan',
        description: 'Analyze your latest website',
        icon: Search,
        action: () => {
          navigate('/dashboard#scans');
          setTimeout(() => {
            const scanBtn = document.querySelector('button:contains("New Scan")') as HTMLButtonElement;
            if (scanBtn) scanBtn.click();
          }, 100);
        },
        priority: 2
      },
      {
        id: 'test-ai',
        title: 'Test AI Response',
        description: 'See how AI responds to queries about your brand',
        icon: Bot,
        action: () => {
          navigate('/dashboard#ai-tests');
          setTimeout(() => {
            const section = document.querySelector('[data-section="ai-test-form"]');
            if (section) section.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        },
        priority: 3
      }
    ],
    scans: [
      {
        id: 'add-website',
        title: 'Add Another Website',
        description: 'Analyze more websites',
        icon: Plus,
        action: () => navigate('/dashboard#websites'),
        priority: 1
      },
      {
        id: 'test-ai',
        title: 'Test AI Response',
        description: 'See how AI mentions your scanned sites',
        icon: Bot,
        action: () => navigate('/dashboard#ai-tests'),
        priority: 2
      },
      {
        id: 'view-competitors',
        title: 'Compare Competitors',
        description: 'See how you compare to competitors',
        icon: Users,
        action: () => navigate('/dashboard#competitors'),
        requiresPlan: ['pro', 'growth', 'enterprise'],
        priority: 3
      }
    ],
    'ai-tests': [
      {
        id: 'run-scan',
        title: 'Run Website Scan',
        description: 'Analyze your website for AI optimization',
        icon: Search,
        action: () => navigate('/dashboard#scans'),
        priority: 1
      },
      {
        id: 'add-competitor',
        title: 'Add Competitor',
        description: 'Track competitor AI mentions',
        icon: Users,
        action: () => navigate('/dashboard#competitors'),
        requiresPlan: ['pro', 'growth', 'enterprise'],
        priority: 2
      },
      {
        id: 'generate-report',
        title: 'Generate Report',
        description: 'Create a comprehensive AI findability report',
        icon: FileText,
        action: () => navigate('/dashboard#reports'),
        requiresPlan: ['growth', 'enterprise'],
        priority: 3
      }
    ],
    competitors: [
      {
        id: 'test-ai',
        title: 'Test AI Response',
        description: 'See AI responses about your competitors',
        icon: Bot,
        action: () => navigate('/dashboard#ai-tests'),
        priority: 1
      },
      {
        id: 'run-scan',
        title: 'Scan Your Site',
        description: 'Compare your optimization to competitors',
        icon: Search,
        action: () => navigate('/dashboard#scans'),
        priority: 2
      },
      {
        id: 'generate-report',
        title: 'Competitive Report',
        description: 'Generate a competitive analysis report',
        icon: FileText,
        action: () => navigate('/dashboard#reports'),
        requiresPlan: ['growth', 'enterprise'],
        priority: 3
      }
    ],
    reports: [
      {
        id: 'run-scan',
        title: 'Run New Scan',
        description: 'Get fresh data for your reports',
        icon: Search,
        action: () => navigate('/dashboard#scans'),
        priority: 1
      },
      {
        id: 'test-ai',
        title: 'Test AI Changes',
        description: 'Verify improvements from your reports',
        icon: Bot,
        action: () => navigate('/dashboard#ai-tests'),
        priority: 2
      },
      {
        id: 'upgrade-plan',
        title: 'Upgrade Plan',
        description: 'Get more detailed reports and insights',
        icon: Crown,
        action: () => navigate('/account'),
        variant: 'secondary' as const,
        priority: 4
      }
    ]
  };

  // Get actions for current context
  let availableActions = baseActions[context] || [];

  // Filter based on plan requirements
  availableActions = availableActions.filter(action => {
    if (!action.requiresPlan) return true;
    return action.requiresPlan.includes(userPlan);
  });

  // Add upgrade suggestions for locked features
  if (context !== 'dashboard' && userPlan === 'free') {
    availableActions.push({
      id: 'upgrade-unlock',
      title: 'Unlock More Features',
      description: 'Upgrade to access competitive analysis and detailed reports',
      icon: Crown,
      action: () => navigate('/account#upgrade'),
      variant: 'secondary' as const,
      priority: 5
    });
  }

  // Sort by priority
  availableActions.sort((a, b) => a.priority - b.priority);

  // Limit to top 3-4 actions
  availableActions = availableActions.slice(0, 4);

  if (availableActions.length === 0) return null;

  return (
    <Card className={`${className}`}>
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-muted-foreground">Quick Actions</h3>
          {context !== 'dashboard' && (
            <Badge variant="outline" className="text-xs">
              {context.replace('-', ' ')}
            </Badge>
          )}
        </div>
        <div className="grid gap-2 sm:gap-3 md:max-h-96 md:overflow-y-auto">
          {availableActions.map((action) => {
            const Icon = action.icon;
            const isRestricted = action.requiresPlan && !action.requiresPlan.includes(userPlan);
            
            return (
              <Button
                key={action.id}
                variant={action.variant || 'outline'}
                size="sm"
                onClick={action.action}
                disabled={isRestricted}
                className="justify-start h-auto p-2 sm:p-3 text-left hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <div className="flex items-start gap-2 sm:gap-3 w-full">
                  <Icon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                    isRestricted ? 'text-muted-foreground' : ''
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                      <span className="text-sm font-medium truncate">{action.title}</span>
                      {isRestricted && (
                        <Crown className="h-3 w-3 text-amber-500 flex-shrink-0" />
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground block mt-0.5 line-clamp-2 sm:line-clamp-none">
                      {action.description}
                    </span>
                  </div>
                </div>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}