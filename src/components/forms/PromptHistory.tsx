import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, Users } from "lucide-react";
import { format } from "date-fns";

interface PromptHistoryItem {
  id: string;
  prompt: string;
  run_date: string;
  includes_user_site: boolean;
  competitor_mentions?: number;
  result?: {
    summary?: string;
    competitors?: string[];
  };
}

interface PromptHistoryProps {
  history: PromptHistoryItem[];
  onSelectPrompt?: (item: PromptHistoryItem) => void;
}

export function PromptHistory({ history, onSelectPrompt }: PromptHistoryProps) {
  if (history.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <h3 className="text-lg font-semibold text-card-foreground mb-2">
            No prompts run yet
          </h3>
          <p className="text-muted-foreground">
            Run your first AI prompt to see how AI models discover your content
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground">Recent AI Tests</h3>
      <div className="space-y-3">
        {history.map((item) => (
          <Card 
            key={item.id} 
            className="cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => onSelectPrompt?.(item)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <CardTitle className="text-sm font-medium leading-relaxed">
                  {item.prompt}
                </CardTitle>
                <div className="flex items-center gap-2 shrink-0">
                  {item.includes_user_site ? (
                    <Badge variant="default" className="text-xs">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Found
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">
                      <XCircle className="w-3 h-3 mr-1" />
                      Not Found
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{format(new Date(item.run_date), "MMM d, yyyy 'at' h:mm a")}</span>
                {item.competitor_mentions ? (
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    <span>{item.competitor_mentions} competitors</span>
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}