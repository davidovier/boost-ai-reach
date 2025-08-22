import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, Users, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";

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
  onRerunPrompt?: (prompt: string) => void;
}

export function PromptHistory({ history, onSelectPrompt, onRerunPrompt }: PromptHistoryProps) {
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
    <div className="prompt-history space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Recent Prompts</h3>
        <div className="text-xs text-muted-foreground">
          Click to view • Hover to rerun
        </div>
      </div>
      
      <div className="prompt-history__grid space-y-3">
        {history.map((item, index) => (
          <div 
            key={item.id}
            className="prompt-history__item animate-fade-in"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="prompt-history__bubble group relative">
              <div 
                className="prompt-history__content cursor-pointer"
                onClick={() => onSelectPrompt?.(item)}
              >
                <div className="prompt-history__text">
                  {item.prompt}
                </div>
                
                <div className="prompt-history__meta">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(item.run_date), "MMM d")}
                    </span>
                    
                    <div className="flex items-center gap-2">
                      {item.includes_user_site ? (
                        <Badge variant="default" className="prompt-history__badge">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Found
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="prompt-history__badge">
                          <XCircle className="w-3 h-3 mr-1" />
                          Not Found
                        </Badge>
                      )}
                      
                      {item.competitor_mentions && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Users className="w-3 h-3" />
                          <span>{item.competitor_mentions}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {onRerunPrompt && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="prompt-history__rerun absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRerunPrompt(item.prompt);
                  }}
                  title="Rerun this prompt"
                >
                  <RotateCcw className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}