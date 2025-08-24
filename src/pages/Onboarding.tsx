import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SEO } from '@/components/SEO';
import { Sparkles, ArrowRight } from 'lucide-react';
import { OnboardingChecklist } from '@/components/onboarding/OnboardingChecklist';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export default function Onboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      supabase.from('user_events').insert({
        user_id: user.id,
        event_name: 'onboarding_started',
        metadata: {
          started_at: new Date().toISOString()
        }
      });
    }
  }, [user]);

  const handleOnboardingComplete = () => {
    navigate('/dashboard');
  };

  const handleSkip = async () => {
    if (user) {
      await supabase.from('user_events').insert({
        user_id: user.id,
        event_name: 'onboarding_skipped',
        metadata: {
          skipped_at: new Date().toISOString()
        }
      });
    }
    navigate('/dashboard');
  };

  return (
    <>
      <SEO 
        title="Getting Started"
        description="Complete your onboarding to optimize your website for AI findability and boost your brand's online presence with actionable insights."
        url="/onboarding"
        noindex={true}
      />

      <main className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
        <div className="container mx-auto px-4 py-8 md:py-16">
          {/* Header */}
          <div className="text-center mb-8 md:mb-12">
            <div className="flex items-center justify-center mb-4">
              <Sparkles className="h-8 w-8 text-primary mr-2" />
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Get Started with FindableAI
              </h1>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Complete your setup to start optimizing your website for AI discovery
            </p>
          </div>

          {/* Onboarding Checklist */}
          <div className="max-w-2xl mx-auto">
            <OnboardingChecklist 
              onComplete={handleOnboardingComplete}
            />
          </div>

          {/* Skip Option */}
          <div className="text-center mt-8">
            <Button variant="ghost" onClick={handleSkip} className="text-muted-foreground">
              Skip for now
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </main>
    </>
  );
}