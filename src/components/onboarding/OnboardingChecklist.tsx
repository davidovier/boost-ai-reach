import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle, Circle, Sparkles, Target, BarChart3 } from 'lucide-react';
import { useABTest, trackABTestEvent, ABTestVariant } from '@/hooks/useABTest';
import { useAuth } from '@/hooks/useAuth';

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  action?: () => void;
}

interface OnboardingChecklistProps {
  onComplete?: () => void;
  className?: string;
}

export function OnboardingChecklist({ onComplete, className = '' }: OnboardingChecklistProps) {
  const { variant, loading } = useABTest('onboarding_checklist');
  const { user } = useAuth();
  const [items, setItems] = useState<ChecklistItem[]>([]);

  useEffect(() => {
    if (!variant) return;

    const baseItems: ChecklistItem[] = [
      {
        id: 'welcome',
        title: 'Welcome to FindableAI',
        description: 'Get started with AI findability optimization',
        completed: true
      }
    ];

    if (variant === 'short') {
      setItems([
        ...baseItems,
        {
          id: 'add_site',
          title: 'Add Your Website',
          description: 'Enter your website URL to begin scanning',
          completed: false
        },
        {
          id: 'run_scan',
          title: 'Run First Scan',
          description: 'Analyze your site\'s AI findability',
          completed: false
        }
      ]);
    } else {
      setItems([
        ...baseItems,
        {
          id: 'learn_about_ai',
          title: 'Learn About AI Findability',
          description: 'Understand how AI tools discover content',
          completed: false
        },
        {
          id: 'add_site',
          title: 'Add Your Website',
          description: 'Enter your website URL for analysis',
          completed: false
        },
        {
          id: 'run_scan',
          title: 'Run Comprehensive Scan',
          description: 'Deep analysis of metadata, schema, and structure',
          completed: false
        },
        {
          id: 'test_prompts',
          title: 'Test AI Prompts',
          description: 'See how AI responds to queries about your industry',
          completed: false
        },
        {
          id: 'review_tips',
          title: 'Review Optimization Tips',
          description: 'Get actionable recommendations for improvement',
          completed: false
        }
      ]);
    }
  }, [variant]);

  const handleItemClick = async (itemId: string) => {
    setItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, completed: !item.completed } : item
    ));

    // Track individual step completion
    if (variant && user) {
      await trackABTestEvent(
        'onboarding_checklist',
        'onboarding_step_completed',
        variant,
        { step_id: itemId }
      );
    }
  };

  const handleComplete = async () => {
    const completedCount = items.filter(item => item.completed).length;
    const totalCount = items.length;
    const completionRate = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

    // Track completion event
    if (variant && user) {
      await trackABTestEvent(
        'onboarding_checklist',
        'onboarding_completed',
        variant,
        {
          completed_steps: completedCount,
          total_steps: totalCount,
          completion_rate: completionRate,
          completed_at: new Date().toISOString()
        }
      );
    }

    onComplete?.();
  };

  if (loading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-muted rounded mb-4 w-3/4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-4 bg-muted rounded w-full"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  const completedCount = items.filter(item => item.completed).length;
  const totalCount = items.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-primary/10">
          {variant === 'short' ? (
            <Target className="w-5 h-5 text-primary" />
          ) : (
            <Sparkles className="w-5 h-5 text-primary" />
          )}
        </div>
        <div>
          <h3 className="text-lg font-semibold">
            {variant === 'short' ? 'Quick Start' : 'Complete Onboarding'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {variant === 'short' 
              ? 'Get started in 2 simple steps'
              : 'Master AI findability in 5 guided steps'
            }
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-medium">{completedCount}/{totalCount}</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Checklist Items */}
      <div className="space-y-3 mb-6">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => handleItemClick(item.id)}
          >
            {item.completed ? (
              <CheckCircle className="w-5 h-5 text-primary mt-0.5" />
            ) : (
              <Circle className="w-5 h-5 text-muted-foreground mt-0.5" />
            )}
            <div className="flex-1">
              <h4 className={`font-medium ${item.completed ? 'text-muted-foreground line-through' : ''}`}>
                {item.title}
              </h4>
              <p className="text-sm text-muted-foreground">
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Completion Button */}
      <Button 
        onClick={handleComplete}
        className="w-full"
        disabled={completedCount === 0}
      >
        <BarChart3 className="w-4 h-4 mr-2" />
        {completedCount === totalCount 
          ? 'Continue to Dashboard' 
          : `Continue (${completedCount}/${totalCount} completed)`
        }
      </Button>

      {/* Variant Debug Info (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-2 bg-muted rounded text-xs text-muted-foreground">
          A/B Test Variant: {variant}
        </div>
      )}
    </Card>
  );
}