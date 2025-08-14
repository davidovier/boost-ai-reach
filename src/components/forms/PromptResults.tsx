import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, Users, MessageSquare, ExternalLink } from "lucide-react";

interface PromptResult {
  id: string;
  prompt: string;
  includes_user_site: boolean;
  result: {
    summary: string;
    competitors: string[];
    mentions: string[];
  };
  run_date: string;
}

interface PromptResultsProps {
  result: PromptResult | null;
}

export function PromptResults({ result }: PromptResultsProps) {
  if (!result) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-card-foreground mb-2">
            No results yet
          </h3>
          <p className="text-muted-foreground">
            Run an AI test to see detailed results here
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-1">Test Results</h3>
          <p className="text-sm text-muted-foreground">"{result.prompt}"</p>
        </div>
        <Badge variant={result.includes_user_site ? "default" : "secondary"}>
          {result.includes_user_site ? (
            <>
              <CheckCircle className="w-3 h-3 mr-1" />
              Your site found
            </>
          ) : (
            <>
              <XCircle className="w-3 h-3 mr-1" />
              Not found
            </>
          )}
        </Badge>
      </div>

      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="ai-response">
          <AccordionTrigger className="text-left">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              AI Response Summary
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm leading-relaxed text-foreground">
                  {result.result.summary}
                </p>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        {result.result.competitors.length > 0 && (
          <AccordionItem value="competitors">
            <AccordionTrigger className="text-left">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Competitors Found ({result.result.competitors.length})
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    {result.result.competitors.map((competitor, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <span className="font-medium text-sm">{competitor}</span>
                        <ExternalLink className="w-4 h-4 text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </AccordionContent>
          </AccordionItem>
        )}

        {result.result.mentions.length > 0 && (
          <AccordionItem value="mentions">
            <AccordionTrigger className="text-left">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Your Mentions ({result.result.mentions.length})
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    {result.result.mentions.map((mention, index) => (
                      <div key={index} className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                        <p className="text-sm text-foreground">"{mention}"</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
    </div>
  );
}