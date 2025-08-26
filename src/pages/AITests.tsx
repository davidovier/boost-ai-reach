import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useUsageLimits } from "@/hooks/useUsageLimits";
import { SEO } from "@/components/SEO";
import { PromptForm } from "@/components/forms/PromptForm";
import { PromptHistory } from "@/components/forms/PromptHistory";
import { PromptResults } from "@/components/forms/PromptResults";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getBreadcrumbJsonLd, stringifyJsonLd } from "@/lib/seo";
import { Skeleton } from "@/components/ui/skeleton-enhanced";
import { UsageLimitBanner } from "@/components/ui/usage-limit-banner";
import { UpgradeModal } from "@/components/ui/upgrade-modal";


export default function AITests() {
  const { user } = useAuth();
  const { data: subscription } = useSubscription();
  const { getReachedLimits, getNearLimitWarnings, hasReachedLimits, hasNearLimitWarnings, refresh } = useUsageLimits();
  const { toast } = useToast();
  const [selectedResult, setSelectedResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  const breadcrumbs = getBreadcrumbJsonLd([
    { name: 'Home', item: origin },
    { name: 'AI Tests', item: `${origin}/ai-tests` },
  ]);

  // Fetch prompt history
  useEffect(() => {
    if (!user) return;
    
    const fetchHistory = async () => {
      try {
        const { data, error } = await supabase
          .from('prompt_simulations')
          .select('*')
          .eq('user_id', user.id)
          .order('run_date', { ascending: false })
          .limit(10);

        if (error) throw error;

        // Transform data to match expected format
        const transformedHistory = data?.map(item => {
          const resultData = item.result as any; // Type assertion for JSON data
          return {
            id: item.id,
            prompt: item.prompt,
            run_date: item.run_date,
            includes_user_site: item.includes_user_site,
            competitor_mentions: resultData?.analysis?.competitor_domains?.length || 0,
            result: {
              summary: resultData?.response || '',
              competitors: resultData?.analysis?.competitor_domains || [],
              mentions: resultData?.analysis?.user_domains_mentioned || []
            }
          };
        }) || [];

        setHistory(transformedHistory);
      } catch (error) {
        console.error('Error fetching prompt history:', error);
      } finally {
        setHistoryLoading(false);
      }
    };

    fetchHistory();
  }, [user]);

  const handleSubmitPrompt = async (data: { prompt: string }) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to run AI tests",
        variant: "destructive"
      });
      return;
    }

    // Check usage limits
    const currentUsage = subscription?.usage?.prompt_count || 0;
    const maxPrompts = subscription?.limits?.max_prompts || 1;

    if (currentUsage >= maxPrompts) {
      setShowUpgradeModal(true);
      return;
    }

    setIsLoading(true);

    try {
      const { data: result, error } = await supabase.functions.invoke('run-prompt', {
        body: { prompt: data.prompt }
      });

      if (error) throw error;

      // Handle the response structure from the edge function
      const simulation = result?.simulation;
      if (simulation) {
        // Transform the data to match the expected format
        const transformedResult = {
          id: simulation.id,
          prompt: simulation.prompt,
          includes_user_site: simulation.mentionedUserSite,
          run_date: simulation.run_date,
          result: {
            summary: simulation.response,
            competitors: simulation.competitors || [],
            mentions: simulation.analysis?.user_domains_mentioned || [],
            analysis: simulation.analysis
          }
        };
        
        setSelectedResult(transformedResult);
        
        // Success animation and refresh usage
        toast({
          title: "✨ AI test completed",
          description: "Results are ready for review",
          className: "success-animation"
        });
        
        // Refresh usage data and history
        refresh();
        
        // Add the new result to history
        setHistory(prev => [transformedResult, ...prev.slice(0, 9)]);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error running prompt:', error);
      toast({
        title: "Error running test",
        description: error?.message || "Please try again later",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <SEO 
        title="AI Findability Tests"
        description="Test how AI models discover and mention your website with custom prompts, competitive analysis, and detailed results."
        url="/ai-tests" 
        keywords="AI prompts, AI testing, brand discovery, AI visibility"
      />
      
      <script 
        type="application/ld+json" 
        dangerouslySetInnerHTML={{ __html: stringifyJsonLd(breadcrumbs) }} 
      />

        <div className="space-y-6 sm:space-y-8 form-mobile">
          <header className="text-mobile">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground heading-responsive">AI Findability Tests</h1>
            <p className="text-muted-foreground mt-1 sm:mt-2 text-responsive">
              Test how AI models discover and recommend your website with custom prompts
            </p>
          </header>

          {/* Usage Limit Warnings */}
          {hasNearLimitWarnings() && (
            <UsageLimitBanner 
              warnings={getNearLimitWarnings().filter(w => w.type === 'prompt')} 
            />
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            {/* Input Form */}
            <div className="space-y-4 sm:space-y-6 card-reveal">
              <div className="space-y-3 sm:space-y-4 interactive-hover p-6 rounded-lg border border-border bg-card">
                <h2 className="text-lg sm:text-xl font-semibold text-foreground">Run New Test</h2>
                <div className={isLoading ? 'form-submitting' : ''}>
                  <PromptForm onSubmit={handleSubmitPrompt} isLoading={isLoading} />
                </div>
                
                {subscription && (
                  <div className="text-xs sm:text-sm text-muted-foreground bg-muted/30 p-3 rounded-md animated-progress">
                    <div className="flex justify-between items-center mb-1">
                      <span>Usage:</span>
                      <span>{subscription.usage?.prompt_count || 0} / {subscription.limits?.max_prompts || 1} prompts this month</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-1.5">
                      <div 
                        className="progress-fill bg-gradient-to-r from-primary to-primary-glow h-1.5 rounded-full"
                        style={{ 
                          width: `${Math.min(100, ((subscription.usage?.prompt_count || 0) / (subscription.limits?.max_prompts || 1)) * 100)}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>

              <div className="stagger-animation">
                <PromptHistory 
                  history={history}
                  loading={historyLoading}
                  onSelectPrompt={setSelectedResult}
                  onRerunPrompt={(prompt) => handleSubmitPrompt({ prompt })}
                  onRunFirstTest={() => {
                    // Focus on the prompt input
                    const input = document.querySelector('textarea[placeholder*="prompt"]') as HTMLTextAreaElement;
                    if (input) {
                      input.focus();
                      input.placeholder = "Try: 'Best marketing agencies in London'";
                    }
                  }}
                />
              </div>
            </div>

            {/* Results Panel */}
            <div className="space-y-4 sm:space-y-6 card-reveal" style={{ animationDelay: '0.2s' }} key={selectedResult?.id || 'empty'}>
              <h2 className="text-lg sm:text-xl font-semibold text-foreground">Results</h2>
              <div className={selectedResult ? 'form-success' : ''}>
                <PromptResults result={selectedResult} loading={isLoading} />
              </div>
            </div>
          </div>
        </div>

        {/* Upgrade Modal */}
        <UpgradeModal
          open={showUpgradeModal}
          onOpenChange={setShowUpgradeModal}
          reachedLimits={getReachedLimits().filter(l => l.type === 'prompt')}
          currentPlan="free"
        />
    </>
  );
}