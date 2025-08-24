import { cn } from "@/lib/utils"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'circular' | 'text' | 'card';
  animate?: boolean;
}

function Skeleton({
  className,
  variant = 'default',
  animate = true,
  ...props
}: SkeletonProps) {
  const baseClasses = cn(
    "bg-muted",
    animate && "animate-pulse",
    className
  );

  switch (variant) {
    case 'circular':
      return (
        <div
          className={cn(baseClasses, "rounded-full")}
          {...props}
        />
      );
    case 'text':
      return (
        <div
          className={cn(baseClasses, "h-4 rounded")}
          {...props}
        />
      );
    case 'card':
      return (
        <div
          className={cn(baseClasses, "rounded-lg")}
          {...props}
        />
      );
    default:
      return (
        <div
          className={cn(baseClasses, "rounded-md")}
          {...props}
        />
      );
  }
}

// Pre-built skeleton components for common use cases
export const SkeletonText = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <Skeleton variant="text" className={cn("w-full", className)} {...props} />
);

export const SkeletonCard = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <Skeleton variant="card" className={cn("h-32 w-full", className)} {...props} />
);

export const SkeletonAvatar = ({ size = "md", className, ...props }: React.HTMLAttributes<HTMLDivElement> & { size?: "sm" | "md" | "lg" }) => {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10", 
    lg: "h-16 w-16"
  };
  
  return (
    <Skeleton 
      variant="circular" 
      className={cn(sizeClasses[size], className)} 
      {...props} 
    />
  );
};

export const SkeletonTable = ({ rows = 3, cols = 4 }: { rows?: number; cols?: number }) => (
  <div className="space-y-3">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex space-x-4">
        {Array.from({ length: cols }).map((_, j) => (
          <SkeletonText key={j} className={`flex-1 ${j === 0 ? 'w-1/3' : ''}`} />
        ))}
      </div>
    ))}
  </div>
);

export const SkeletonKPI = () => (
  <div className="space-y-3">
    <div className="flex items-center justify-between">
      <SkeletonText className="w-24 h-4" />
      <Skeleton className="w-8 h-8 rounded-full" />
    </div>
    <div className="space-y-2">
      <Skeleton className="w-20 h-8" />
      <SkeletonText className="w-32 h-3" />
    </div>
  </div>
);

export { Skeleton }