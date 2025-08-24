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
  TrendingUp,
  Globe,
  Shield,
  ShieldX,
  Lock,
  UserX,
  AlertTriangle,
  HelpCircle
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

export const EmptySites = ({ onAddClick }: { onAddClick: () => void }) => (
  <EmptyState
    icon={
      <div className="relative">
        <Globe className="w-12 h-12 text-primary/60" />
        <Plus className="w-6 h-6 text-accent absolute -bottom-1 -right-1 bg-background rounded-full p-1" />
      </div>
    }
    title="No websites added yet"
    description="Add your first website to start monitoring its AI findability score and track optimization progress."
    action={{
      label: "Add Your First Website",
      onClick: onAddClick,
      variant: "default"
    }}
  />
);

// Permission Denied States
export const PermissionDenied = ({ 
  requiredRole, 
  currentRole,
  onContactSupport 
}: { 
  requiredRole?: string;
  currentRole?: string;
  onContactSupport?: () => void;
}) => (
  <EmptyState
    icon={<Shield className="w-12 h-12 text-destructive/60" />}
    title="Access Denied"
    description={
      requiredRole 
        ? `This page requires ${requiredRole} access. Your current role (${currentRole || 'user'}) does not have permission to view this content.`
        : "You don't have permission to access this content. Please contact your administrator if you believe this is an error."
    }
    action={onContactSupport ? {
      label: "Contact Support",
      onClick: onContactSupport,
      variant: "outline"
    } : undefined}
  />
);

export const AdminAccessDenied = ({ 
  onUpgrade,
  onContactSupport 
}: { 
  onUpgrade?: () => void;
  onContactSupport?: () => void;
}) => (
  <EmptyState
    icon={<ShieldX className="w-12 h-12 text-destructive/60" />}
    title="Admin Access Required"
    description="This section is restricted to administrators only. You need admin privileges to access user management, system settings, and advanced features."
    action={onContactSupport ? {
      label: "Contact Administrator",
      onClick: onContactSupport,
      variant: "outline"
    } : undefined}
  />
);

export const PlanUpgradeRequired = ({ 
  requiredPlan,
  currentPlan,
  onUpgrade 
}: { 
  requiredPlan: string;
  currentPlan?: string;
  onUpgrade: () => void;
}) => (
  <EmptyState
    icon={<Lock className="w-12 h-12 text-primary/60" />}
    title="Upgrade Required"
    description={`This feature requires a ${requiredPlan} plan. Your current plan (${currentPlan || 'Free'}) doesn't include access to this functionality.`}
    action={{
      label: `Upgrade to ${requiredPlan}`,
      onClick: onUpgrade,
      variant: "default"
    }}
  />
);

export const SessionExpired = ({ onSignIn }: { onSignIn: () => void }) => (
  <EmptyState
    icon={<UserX className="w-12 h-12 text-muted-foreground/60" />}
    title="Session Expired"
    description="Your session has expired for security reasons. Please sign in again to continue using the application."
    action={{
      label: "Sign In Again",
      onClick: onSignIn,
      variant: "default"
    }}
  />
);

export const MaintenanceMode = ({ 
  estimatedReturn,
  onRefresh 
}: { 
  estimatedReturn?: string;
  onRefresh?: () => void;
}) => (
  <EmptyState
    icon={<AlertTriangle className="w-12 h-12 text-primary/60" />}
    title="Maintenance Mode"
    description={
      estimatedReturn 
        ? `We're performing scheduled maintenance. Expected return: ${estimatedReturn}. Thank you for your patience.`
        : "We're performing scheduled maintenance. Please check back shortly. Thank you for your patience."
    }
    action={onRefresh ? {
      label: "Refresh Page",
      onClick: onRefresh,
      variant: "outline"
    } : undefined}
  />
);

export const UnexpectedError = ({ 
  onRetry,
  onReportIssue 
}: { 
  onRetry?: () => void;
  onReportIssue?: () => void;
}) => (
  <EmptyState
    icon={<HelpCircle className="w-12 h-12 text-destructive/60" />}
    title="Something went wrong"
    description="An unexpected error occurred. Our team has been notified. Please try again or contact support if the problem persists."
    action={onRetry ? {
      label: "Try Again",
      onClick: onRetry,
      variant: "default"
    } : onReportIssue ? {
      label: "Report Issue",
      onClick: onReportIssue,
      variant: "outline"
    } : undefined}
  />
);