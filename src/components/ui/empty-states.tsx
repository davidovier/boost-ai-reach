import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Search, 
  Zap, 
  BarChart3, 
  Users, 
  FileText, 
  MessageSquare, 
  Plus,
  Sparkles,
  Activity,
  TrendingUp
} from "lucide-react";
import { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: "default" | "outline" | "secondary";
  };
  className?: string;
}

export function EmptyState({ 
  icon, 
  title, 
  description, 
  action, 
  className = "" 
}: EmptyStateProps) {
  return (
    <Card className={`empty-state-card ${className}`}>
      <CardContent className="empty-state-content">
        <div className="empty-state-icon">
          {icon}
        </div>
        <h3 className="empty-state-title">{title}</h3>
        <p className="empty-state-description">{description}</p>
        {action && (
          <Button 
            onClick={action.onClick} 
            variant={action.variant || "default"}
            className="empty-state-cta"
          >
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// Pre-built empty states for common use cases
export const EmptyScans = ({ onAddClick }: { onAddClick: () => void }) => (
  <EmptyState
    icon={<Search className="w-12 h-12 text-primary/60" />}
    title="No scans yet"
    description="Add your first website to start analyzing its AI findability score and get optimization recommendations."
    action={{
      label: "Run Your First Scan",
      onClick: onAddClick,
      variant: "default"
    }}
  />
);

export const EmptyPrompts = ({ onRunClick }: { onRunClick: () => void }) => (
  <EmptyState
    icon={
      <div className="relative">
        <Zap className="w-12 h-12 text-primary/60" />
        <Sparkles className="w-6 h-6 text-accent absolute -top-1 -right-1" />
      </div>
    }
    title="No AI tests yet"
    description="Run your first AI prompt to see how AI models discover and recommend your website content."
    action={{
      label: "Run Your First Test",
      onClick: onRunClick,
      variant: "default"
    }}
  />
);

export const EmptyReports = ({ onGenerateClick }: { onGenerateClick: () => void }) => (
  <EmptyState
    icon={
      <div className="relative">
        <BarChart3 className="w-12 h-12 text-primary/60" />
        <Sparkles className="w-6 h-6 text-accent absolute -top-1 -right-1" />  
      </div>
    }
    title="No reports yet"
    description="Generate your first premium AI findability report with detailed insights, competitor analysis, and actionable recommendations."
    action={{
      label: "Generate Your First Report",
      onClick: onGenerateClick,
      variant: "default"
    }}
  />
);

export const EmptyCompetitors = ({ onAddClick }: { onAddClick: () => void }) => (
  <EmptyState
    icon={<Users className="w-12 h-12 text-primary/60" />}
    title="No competitors yet"
    description="Add your first competitor to start tracking their AI findability scores and compare performance."
    action={{
      label: "Add Your First Competitor",
      onClick: onAddClick,
      variant: "default"
    }}
  />
);

export const EmptyActivity = () => (
  <EmptyState
    icon={<Activity className="w-12 h-12 text-muted-foreground/60" />}
    title="No activity yet"
    description="Start by scanning your first website or running an AI test to see your activity here."
  />
);

export const EmptyResults = () => (
  <EmptyState
    icon={<MessageSquare className="w-12 h-12 text-muted-foreground/60" />}
    title="No results yet"
    description="Run an AI test to see detailed results and analysis here."
  />
);

export const EmptyUsers = () => (
  <EmptyState
    icon={<Users className="w-12 h-12 text-muted-foreground/60" />}
    title="No users found"
    description="No users match your current filter criteria."
  />
);

export const EmptyAuditLogs = () => (
  <EmptyState
    icon={<FileText className="w-12 h-12 text-muted-foreground/60" />}
    title="No audit logs"
    description="No audit log entries have been recorded yet."
  />
);

export const EmptyUsage = () => (
  <EmptyState
    icon={<TrendingUp className="w-12 h-12 text-muted-foreground/60" />}
    title="No usage data"
    description="No usage metrics are available at this time."
  />
);