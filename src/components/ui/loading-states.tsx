import { Skeleton, SkeletonCard, SkeletonTable, SkeletonKPI } from "./skeleton-enhanced";
import { Card, CardContent, CardHeader } from "./card";

// Dashboard loading states
export const DashboardKPISkeleton = () => (
  <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-4">
    {Array.from({ length: 4 }).map((_, i) => (
      <Card key={i} className="animate-pulse">
        <CardContent className="p-6">
          <SkeletonKPI />
        </CardContent>
      </Card>
    ))}
  </div>
);

export const DashboardActivitySkeleton = () => (
  <Card>
    <CardHeader>
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-4 w-48" />
    </CardHeader>
    <CardContent className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </CardContent>
  </Card>
);

// Scans loading states
export const ScansListSkeleton = () => (
  <div className="space-y-4">
    {Array.from({ length: 5 }).map((_, i) => (
      <Card key={i} className="animate-pulse">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <div className="flex items-center gap-4">
              <Skeleton className="h-6 w-12 rounded-full" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

export const ScansTableSkeleton = () => (
  <Card>
    <CardContent className="p-0">
      <SkeletonTable rows={5} cols={5} />
    </CardContent>
  </Card>
);

// Reports loading states
export const ReportsGridSkeleton = () => (
  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
    {Array.from({ length: 6 }).map((_, i) => (
      <Card key={i} className="premium-report-card animate-pulse">
        <div className="report-preview-skeleton">
          <div className="h-32 bg-gradient-to-br from-muted to-muted-foreground/20 rounded-lg"></div>
        </div>
        <CardContent className="p-4">
          <div className="space-y-3">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <div className="flex gap-2">
              <Skeleton className="h-8 flex-1" />
              <Skeleton className="h-8 flex-1" />
            </div>
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

// AI Tests loading states
export const PromptHistorySkeleton = () => (
  <Card>
    <CardHeader>
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-4 w-48" />
    </CardHeader>
    <CardContent className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="p-4 border border-border rounded-lg">
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        </div>
      ))}
    </CardContent>
  </Card>
);

export const PromptResultsSkeleton = () => (
  <Card>
    <CardHeader>
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-4 w-48" />
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-20" />
      </div>
    </CardContent>
  </Card>
);

// Competitors loading states
export const CompetitorsChartSkeleton = () => (
  <Card>
    <CardHeader>
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-4 w-64" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-64 w-full" />
    </CardContent>
  </Card>
);

export const CompetitorsTableSkeleton = () => (
  <Card>
    <CardHeader>
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-8 w-16" />
      </div>
    </CardHeader>
    <CardContent>
      <SkeletonTable rows={4} cols={4} />
    </CardContent>
  </Card>
);

// Admin loading states
export const AdminStatsSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    {Array.from({ length: 4 }).map((_, i) => (
      <Card key={i} className="stat-card animate-pulse">
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-24" />
        </CardHeader>
        <CardContent className="pt-0">
          <Skeleton className="h-8 w-16" />
        </CardContent>
      </Card>
    ))}
  </div>
);