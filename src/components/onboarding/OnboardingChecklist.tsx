import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle, Circle, Sparkles, BarChart3 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  action?: () => void;
  actionPath?: string;
}

interface OnboardingChecklistProps {
  onComplete?: () => void;
  className?: string;
}

export function OnboardingChecklist({ onComplete, className = '' }: OnboardingChecklistProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<ChecklistItem[]>([]);

  const checkProgress = async () => {
    if (!user) return;

    try {
      // Check if user has sites
      const { data: sites } = await supabase
        .from('sites')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      // Check if user has scans
      const { data: scans } = await supabase
        .from('scans')
        .select('id')
        .eq('site_id', sites?.[0]?.id)
        .limit(1);

      // Check if user has prompt simulations
      const { data: prompts } = await supabase
        .from('prompt_simulations')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      const onboardingItems: ChecklistItem[] = [
        {
          id: 'welcome',
          title: 'Welcome to FindableAI',
          description: 'Get started with AI findability optimization',
          completed: true
        },
        {
          id: 'add_site',
          title: 'Add Your Website',
          description: 'Enter your website URL for analysis',
          completed: (sites?.length || 0) > 0,
          actionPath: '/sites'
        },
        {
          id: 'run_scan',
          title: 'Run Comprehensive Scan',
          description: 'Deep analysis of metadata, schema, and structure',
          completed: (scans?.length || 0) > 0,
          actionPath: sites?.length ? `/scans?siteId=${sites[0].id}` : '/sites'
        },
        {
          id: 'test_prompts',
          title: 'Test AI Prompts',
          description: 'See how AI responds to queries about your industry',
          completed: (prompts?.length || 0) > 0,
          actionPath: '/ai-tests'
        },
        {
          id: 'review_tips',
          title: 'Review Optimization Tips',
          description: 'Get actionable recommendations for improvement',
          completed: (scans?.length || 0) > 0,
          actionPath: '/scans'
        }
      ];

      setItems(onboardingItems);
    } catch (error) {
      console.error('Error checking onboarding progress:', error);
    }
  };

  useEffect(() => {
    checkProgress();
  }, [user]);

  // Refresh progress when navigating back to onboarding page
  useEffect(() => {
    const handleFocus = () => checkProgress();
    const handleOnboardingRefresh = () => checkProgress();
    
    window.addEventListener('focus', handleFocus);
    window.addEventListener('onboarding-refresh', handleOnboardingRefresh);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('onboarding-refresh', handleOnboardingRefresh);
    };
  }, []);

  // Add a method to refresh progress that can be called externally
  useEffect(() => {
    const interval = setInterval(checkProgress, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, [user]);

  const handleItemClick = async (item: ChecklistItem) => {
    // If item has an action path and isn't completed, navigate to it
    if (item.actionPath && !item.completed) {
      navigate(item.actionPath);
      return;
    }

    // Toggle completion status
    setItems(prev => prev.map(i => 
      i.id === item.id ? { ...i, completed: !i.completed } : i
    ));
  };

  const handleComplete = () => {
    // Hide the onboarding checklist
    onComplete?.();
    
    // Navigate to dashboard if not already there
    if (window.location.pathname !== '/dashboard') {
      navigate('/dashboard');
    }
  };


  const completedCount = items.filter(item => item.completed).length;
  const totalCount = items.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-primary/10">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">
            Get Started with FindableAI
          </h3>
          <p className="text-sm text-muted-foreground">
            Follow these steps to optimize your AI visibility
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
            className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
              item.actionPath && !item.completed 
                ? 'cursor-pointer hover:bg-primary/5 hover:border-primary/30' 
                : item.completed 
                  ? 'cursor-pointer hover:bg-muted/50' 
                  : 'cursor-default'
            }`}
            onClick={() => handleItemClick(item)}
          >
            {item.completed ? (
              <CheckCircle className="w-5 h-5 text-primary mt-0.5" />
            ) : (
              <Circle className="w-5 h-5 text-muted-foreground mt-0.5" />
            )}
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className={`font-medium ${item.completed ? 'text-muted-foreground line-through' : ''}`}>
                  {item.title}
                </h4>
                {item.actionPath && !item.completed && (
                  <span className="text-xs text-primary font-medium">Click to start →</span>
                )}
              </div>
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
          ? 'Got it! Continue to Dashboard' 
          : `Continue Anyway (${completedCount}/${totalCount} completed)`
        }
      </Button>
    </Card>
  );
}