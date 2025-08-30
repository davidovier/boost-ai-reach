import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Zap,
  Bot,
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUsageLimits } from '@/hooks/useUsageLimits';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface AITest {
  id: string;
  prompt: string;
  created_at: string;
  site_mentioned: boolean;
  response_preview?: string;
}

interface AITestsTabProps {
  aiTests: AITest[];
  onDataUpdate: () => void;
}

export function AITestsTab({ aiTests, onDataUpdate }: AITestsTabProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { canUseFeature } = useUsageLimits();
  const [prompt, setPrompt] = useState('');
  const [isRunning, setIsRunning] = useState(false);

  const handleRunTest = async () => {
    if (!prompt.trim()) {
      toast({
        title: 'Prompt required',
        description: 'Please enter a prompt to test',
        variant: 'destructive',
      });
      return;
    }

    if (prompt.trim().length < 10) {
      toast({
        title: 'Prompt too short',
        description: 'Please enter at least 10 characters',
        variant: 'destructive',
      });
      return;
    }

    if (prompt.trim().length > 500) {
      toast({
        title: 'Prompt too long',
        description: 'Please keep prompts under 500 characters',
        variant: 'destructive',
      });
      return;
    }

    if (!canUseFeature('prompts')) {
      toast({
        title: 'AI test limit reached',
        description: 'Upgrade your plan to run more AI tests',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsRunning(true);
      
      const { data, error } = await supabase.functions.invoke('test-ai-prompt', {
        body: { 
          prompt: prompt.trim(),
          userId: user?.id 
        }
      });

      if (error) throw error;

      toast({
        title: 'AI test completed',
        description: data?.site_mentioned 
          ? 'Your website was mentioned in the AI response!'
          : 'Your website was not mentioned in this response',
      });

      setPrompt('');
      onDataUpdate();
    } catch (error: unknown) {
      toast({
        title: 'Test failed',
        description: (error as Error)?.message || 'Failed to run AI test',
        variant: 'destructive',
      });
    } finally {
      setIsRunning(false);
    }
  };

  const getMentionIcon = (mentioned: boolean) => {
    return mentioned ? CheckCircle2 : XCircle;
  };

  const getMentionColor = (mentioned: boolean) => {
    return mentioned ? 'text-green-600' : 'text-red-600';
  };

  const getMentionBadge = (mentioned: boolean) => {
    return mentioned ? (
      <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
        <CheckCircle2 className="h-3 w-3 mr-1" />
        Found
      </Badge>
    ) : (
      <Badge variant="secondary" className="bg-red-100 text-red-800 hover:bg-red-100">
        <XCircle className="h-3 w-3 mr-1" />
        Not Found
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Test Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Run AI Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="prompt">Test Prompt</Label>
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter a prompt to test how AI models respond about your business..."
              className="min-h-[100px] resize-none"
              maxLength={500}
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Ask questions about your industry, services, or specific needs</span>
              <span>{prompt.length}/500</span>
            </div>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              AI tests help you understand if your website appears in AI model responses. 
              Try questions your potential customers might ask.
            </AlertDescription>
          </Alert>

          <Button 
            onClick={handleRunTest}
            disabled={isRunning || !prompt.trim() || prompt.trim().length < 10}
            className="w-full"
          >
            {isRunning ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                Running Test...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Run AI Test
              </>
            )}
          </Button>

          <div className="grid gap-3 text-sm">
            <div className="text-muted-foreground font-medium">Example prompts:</div>
            <div className="space-y-1">
              <button 
                className="text-left text-muted-foreground hover:text-foreground block"
                onClick={() => setPrompt("What are the best SEO tools for small businesses?")}
              >
                • "What are the best SEO tools for small businesses?"
              </button>
              <button 
                className="text-left text-muted-foreground hover:text-foreground block"
                onClick={() => setPrompt("I need help with website optimization")}
              >
                • "I need help with website optimization"
              </button>
              <button 
                className="text-left text-muted-foreground hover:text-foreground block"
                onClick={() => setPrompt("Recommend marketing agencies in my area")}
              >
                • "Recommend marketing agencies in my area"
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Recent AI Tests ({aiTests.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {aiTests.length > 0 ? (
            <div className="space-y-4">
              {aiTests.map((test) => {
                const Icon = getMentionIcon(test.site_mentioned);
                return (
                  <div key={test.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-muted-foreground mb-2">
                          {format(new Date(test.created_at), 'MMM d, yyyy h:mm a')}
                        </div>
                        <div className="text-sm bg-muted p-3 rounded">
                          "{test.prompt}"
                        </div>
                      </div>
                      <div className="ml-4 flex items-center gap-2">
                        {getMentionBadge(test.site_mentioned)}
                      </div>
                    </div>
                    
                    <div className={`flex items-center gap-2 text-sm ${getMentionColor(test.site_mentioned)}`}>
                      <Icon className="h-4 w-4" />
                      <span>
                        {test.site_mentioned 
                          ? 'Your website was mentioned in the AI response'
                          : 'Your website was not mentioned in this response'
                        }
                      </span>
                    </div>
                    
                    {test.response_preview && (
                      <div className="mt-3 text-xs text-muted-foreground">
                        <div className="font-medium mb-1">Response preview:</div>
                        <div className="bg-muted/50 p-2 rounded text-xs">
                          {test.response_preview}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Bot className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No AI Tests Yet</h3>
              <p className="text-muted-foreground mb-4">
                Run your first AI test to see how AI models respond to questions about your business
              </p>
              <div className="max-w-md mx-auto">
                <Input
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Enter a test prompt..."
                  onKeyDown={(e) => e.key === 'Enter' && handleRunTest()}
                />
                <Button 
                  onClick={handleRunTest}
                  disabled={isRunning || !prompt.trim()}
                  className="w-full mt-2"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Run First Test
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Test Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Tips for Effective AI Testing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <h4 className="font-medium text-green-600">✓ Good Prompts</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Ask specific questions about your industry</li>
                <li>• Use natural, conversational language</li>
                <li>• Include relevant keywords customers use</li>
                <li>• Test different variations of the same question</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-medium text-red-600">✗ Avoid These</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Very generic or broad questions</li>
                <li>• Overly promotional language</li>
                <li>• Questions unrelated to your business</li>
                <li>• Extremely long or complex prompts</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}