import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { SEO } from "@/components/SEO";
import { PromptForm } from "@/components/forms/PromptForm";
import { PromptHistory } from "@/components/forms/PromptHistory";
import { PromptResults } from "@/components/forms/PromptResults";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

// Mock data - replace with actual API calls
const mockHistory = [
  {
    id: "1",
    prompt: "Best marketing agencies in London",
    run_date: "2024-01-15T10:30:00Z",
    includes_user_site: true,
    competitor_mentions: 3,
    result: {
      summary: "Found several marketing agencies including top-rated firms specializing in digital marketing and brand strategy.",
      competitors: ["Agency A", "Agency B", "Agency C"],
      mentions: ["Your agency was mentioned as a leading provider"]
    }
  },
  {
    id: "2", 
    prompt: "CRM software recommendations",
    run_date: "2024-01-14T14:15:00Z",
    includes_user_site: false,
    competitor_mentions: 5,
    result: {
      summary: "Multiple CRM solutions were recommended focusing on enterprise and small business needs.",
      competitors: ["Salesforce", "HubSpot", "Pipedrive", "Zoho", "Monday.com"],
      mentions: []
    }
  }
];

export default function AITests() {
  const { user } = useAuth();
  const { data: subscription } = useSubscription();
  const { toast } = useToast();
  const [selectedResult, setSelectedResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

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
      toast({
        title: "Usage limit reached",
        description: "Upgrade your plan to run more AI tests",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data: result, error } = await supabase.functions.invoke('run-prompt', {
        body: { prompt: data.prompt }
      });

      if (error) throw error;

      setSelectedResult(result);
      toast({
        title: "AI test completed",
        description: "Results are ready for review"
      });
    } catch (error) {
      console.error('Error running prompt:', error);
      toast({
        title: "Error running test",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <SEO 
        title="AI Tests - FindableAI"
        description="Test how AI models discover and reference your content with our advanced prompt simulation tools."
        url="/prompts"
      />
      
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">AI Tests</h1>
          <p className="text-muted-foreground mt-2">
            Test how AI models discover and reference your content
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Form */}
          <div className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">Run New Test</h2>
              <PromptForm onSubmit={handleSubmitPrompt} isLoading={isLoading} />
              
              {subscription && (
                <div className="text-sm text-muted-foreground">
                  Usage: {subscription.usage?.prompt_count || 0} / {subscription.limits?.max_prompts || 1} prompts this month
                </div>
              )}
            </div>

            <PromptHistory 
              history={mockHistory}
              onSelectPrompt={setSelectedResult}
            />
          </div>

          {/* Results Panel */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-foreground">Results</h2>
            <PromptResults result={selectedResult} />
          </div>
        </div>
      </div>
    </>
  );
}