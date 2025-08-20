import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  action?: () => void;
  href?: string;
}

export function useOnboardingProgress() {
  const { user } = useAuth();
  const [steps, setSteps] = useState<OnboardingStep[]>([
    {
      id: 'add-site',
      title: 'Add your website',
      description: 'Connect your website to start monitoring',
      completed: false,
      href: '/onboarding'
    },
    {
      id: 'run-scan',
      title: 'Run your first scan',
      description: 'Analyze your site for AI findability',
      completed: false,
      href: '/scans'
    },
    {
      id: 'run-prompt',
      title: 'Test AI visibility',
      description: 'See how AI responds to queries about your brand',
      completed: false,
      href: '/ai-tests'
    },
    {
      id: 'add-competitor',
      title: 'Add a competitor',
      description: 'Track how you compare to competitors',
      completed: false,
      href: '/competitors'
    },
    {
      id: 'generate-report',
      title: 'Generate your first report',
      description: 'Get actionable insights and recommendations',
      completed: false,
      href: '/reports'
    }
  ]);

  const [loading, setLoading] = useState(true);
  const [completedSteps, setCompletedSteps] = useState(0);

  const checkProgress = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

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

      // Check if user has competitors
      const { data: competitors } = await supabase
        .from('competitors')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      // Check if user has reports
      const { data: reports } = await supabase
        .from('reports')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      const newSteps = steps.map(step => {
        switch (step.id) {
          case 'add-site':
            return { ...step, completed: (sites?.length || 0) > 0 };
          case 'run-scan':
            return { ...step, completed: (scans?.length || 0) > 0 };
          case 'run-prompt':
            return { ...step, completed: (prompts?.length || 0) > 0 };
          case 'add-competitor':
            return { ...step, completed: (competitors?.length || 0) > 0 };
          case 'generate-report':
            return { ...step, completed: (reports?.length || 0) > 0 };
          default:
            return step;
        }
      });

      setSteps(newSteps);
      setCompletedSteps(newSteps.filter(step => step.completed).length);
    } catch (error) {
      console.error('Error checking onboarding progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const markStepCompleted = (stepId: string) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, completed: true } : step
    ));
    setCompletedSteps(prev => prev + 1);
  };

  const resetProgress = () => {
    setSteps(prev => prev.map(step => ({ ...step, completed: false })));
    setCompletedSteps(0);
  };

  const isCompleted = completedSteps === steps.length;
  const progressPercentage = (completedSteps / steps.length) * 100;

  useEffect(() => {
    checkProgress();
  }, [user]);

  return {
    steps,
    loading,
    completedSteps,
    totalSteps: steps.length,
    isCompleted,
    progressPercentage,
    markStepCompleted,
    resetProgress,
    refreshProgress: checkProgress
  };
}