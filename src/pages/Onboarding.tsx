import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Suspense } from 'react';
import { LazyConfetti } from '@/components/lazy/LazyReactConfetti';
import { CheckCircle, Circle, ArrowRight, Trophy, Sparkles } from 'lucide-react';
import { SEO } from '@/components/SEO';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useOnboardingProgress } from '@/hooks/useOnboardingProgress';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { stringifyJsonLd } from '@/lib/seo';

export default function Onboarding() {
  const [url, setUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    steps, 
    loading, 
    completedSteps, 
    totalSteps, 
    isCompleted, 
    progressPercentage, 
    refreshProgress 
  } = useOnboardingProgress();

  useEffect(() => {
    if (isCompleted && !showConfetti) {
      setShowConfetti(true);
      // Stop confetti after 5 seconds
      setTimeout(() => setShowConfetti(false), 5000);
    }
  }, [isCompleted, showConfetti]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/signin');
      return;
    }

    setIsSubmitting(true);
    try {
      const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
      
      // Create the site
      const { data: site, error } = await supabase
        .from('sites')
        .insert({
          user_id: user.id,
          url: parsed.toString(),
          name: parsed.hostname
        })
        .select()
        .single();

      if (error) throw error;

      toast({ 
        title: 'Site added successfully!', 
        description: `${parsed.hostname} has been added to your dashboard.` 
      });
      
      // Refresh progress to update the checklist
      await refreshProgress();
      
      // Reset the form
      setUrl('');
    } catch (error: any) {
      if (error.code === '23505') {
        toast({ 
          title: 'Site already exists', 
          description: 'This website is already in your dashboard.',
          variant: 'destructive' 
        });
      } else {
        toast({ 
          title: 'Invalid URL', 
          description: 'Please enter a valid website like example.com', 
          variant: 'destructive' 
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStepClick = (step: any) => {
    if (step.href) {
      navigate(step.href);
    }
  };

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Get Started with FindableAI',
    description: 'Complete your onboarding checklist to optimize your website for AI findability',
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: steps.map((step, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: step.title,
        description: step.description
      }))
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your progress...</p>
        </div>
      </main>
    );
  }

  return (
    <>
      <SEO 
        title="Getting Started"
        description="Complete your onboarding to optimize your website for AI findability and boost your brand's online presence with actionable insights."
        url="/onboarding"
        noindex={true}
      />
      
      <script 
        type="application/ld+json" 
        dangerouslySetInnerHTML={{ __html: stringifyJsonLd(structuredData) }} 
      />

      {showConfetti && (
        <Suspense fallback={null}>
          <LazyConfetti
            width={window.innerWidth}
            height={window.innerHeight}
            recycle={false}
            numberOfPieces={200}
            gravity={0.3}
          />
        </Suspense>
      )}

      <main className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
        <div className="container mx-auto px-4 py-8 md:py-16">
          {/* Header */}
          <div className="text-center mb-8 md:mb-12">
            <div className="flex items-center justify-center mb-4">
              {isCompleted ? (
                <Trophy className="h-8 w-8 text-yellow-500 mr-2" />
              ) : (
                <Sparkles className="h-8 w-8 text-primary mr-2" />
              )}
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                {isCompleted ? 'Congratulations!' : 'Get Started with FindableAI'}
              </h1>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {isCompleted 
                ? 'You\'ve completed all onboarding steps! Your website is now optimized for AI findability.'
                : 'Complete these steps to unlock the full potential of AI findability optimization.'
              }
            </p>
          </div>

          {/* Progress Overview */}
          <Card className="mb-8 md:mb-12 max-w-2xl mx-auto">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-muted-foreground">Progress</span>
                <span className="text-sm font-medium">{completedSteps}/{totalSteps} completed</span>
              </div>
              <Progress value={progressPercentage} className="h-3" />
              {isCompleted && (
                <div className="mt-4 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    <span className="text-green-800 dark:text-green-200 font-medium">
                      All steps completed! You're ready to maximize your AI findability.
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Onboarding Steps */}
          <div className="max-w-4xl mx-auto">
            <div className="grid gap-4 md:gap-6">
              {steps.map((step, index) => (
                <Card 
                  key={step.id} 
                  className={`transition-all duration-200 ${
                    step.completed 
                      ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800' 
                      : 'hover:shadow-md cursor-pointer'
                  }`}
                  onClick={() => !step.completed && handleStepClick(step)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        {step.completed ? (
                          <CheckCircle className="h-8 w-8 text-green-600" />
                        ) : (
                          <Circle className="h-8 w-8 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-grow">
                        <h3 className={`text-lg font-semibold ${
                          step.completed ? 'text-green-800 dark:text-green-200' : ''
                        }`}>
                          {step.title}
                        </h3>
                        <p className={`text-sm ${
                          step.completed 
                            ? 'text-green-600 dark:text-green-300' 
                            : 'text-muted-foreground'
                        }`}>
                          {step.description}
                        </p>
                      </div>
                      {!step.completed && (
                        <ArrowRight className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Add Site Form (if first step not completed) */}
          {!steps[0]?.completed && (
            <Card className="mt-8 md:mt-12 max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle className="text-xl">Add Your Website</CardTitle>
                <p className="text-muted-foreground">
                  Enter your website URL to get started with AI findability optimization.
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label htmlFor="site" className="text-sm font-medium">
                      Website URL
                    </label>
                    <Input
                      id="site"
                      type="url"
                      placeholder="https://yourwebsite.com"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button 
                      type="submit" 
                      className="flex-1"
                      disabled={isSubmitting || !url.trim()}
                    >
                      {isSubmitting ? 'Adding Site...' : 'Add Website'}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => navigate('/dashboard')}
                      className="flex-1 sm:flex-none"
                    >
                      Skip for now
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Completion CTA */}
          {isCompleted && (
            <div className="text-center mt-12">
              <Button size="lg" onClick={() => navigate('/dashboard')}>
                Go to Dashboard
              </Button>
            </div>
          )}
        </div>
      </main>
    </>
  );
}