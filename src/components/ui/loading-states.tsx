import * as React from "react"
import { cn } from "@/lib/utils"

interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg"
  "aria-label"?: string
}

export function LoadingSpinner({ 
  className, 
  size = "md", 
  "aria-label": ariaLabel = "Loading",
  ...props 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6", 
    lg: "h-8 w-8"
  }

  return (
    <div
      className={cn("animate-spin rounded-full border-2 border-primary border-t-transparent", sizeClasses[size], className)}
      role="status"
      aria-live="polite"
      aria-label={ariaLabel}
      {...props}
    >
      <span className="sr-only">{ariaLabel}</span>
    </div>
  )
}

// Skeleton components for different sections
export function AdminStatsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4" role="status" aria-label="Loading admin statistics">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-3 p-6 border rounded-lg">
          <div className="h-4 bg-muted rounded animate-pulse w-2/3" />
          <div className="h-8 bg-muted rounded animate-pulse w-1/2" />
        </div>
      ))}
      <span className="sr-only">Loading admin statistics</span>
    </div>
  )
}

export function PromptHistorySkeleton() {
  return (
    <div className="space-y-4" role="status" aria-label="Loading prompt history">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="p-4 border rounded-lg space-y-2">
          <div className="h-4 bg-muted rounded animate-pulse" />
          <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
        </div>
      ))}
      <span className="sr-only">Loading prompt history</span>
    </div>
  )
}

export function PromptResultsSkeleton() {
  return (
    <div className="space-y-4 p-6" role="status" aria-label="Loading prompt results">
      <div className="h-6 bg-muted rounded animate-pulse w-1/3" />
      <div className="space-y-2">
        <div className="h-4 bg-muted rounded animate-pulse" />
        <div className="h-4 bg-muted rounded animate-pulse w-4/5" />
        <div className="h-4 bg-muted rounded animate-pulse w-2/3" />
      </div>
      <span className="sr-only">Loading prompt results</span>
    </div>
  )
}

export function CompetitorsChartSkeleton() {
  return (
    <div className="h-64 bg-muted rounded animate-pulse" role="status" aria-label="Loading competitors chart">
      <span className="sr-only">Loading competitors chart</span>
    </div>
  )
}

export function CompetitorsTableSkeleton() {
  return (
    <div className="space-y-4" role="status" aria-label="Loading competitors table">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4 p-4 border rounded">
          <div className="h-4 bg-muted rounded animate-pulse flex-1" />
          <div className="h-4 bg-muted rounded animate-pulse w-16" />
          <div className="h-4 bg-muted rounded animate-pulse w-20" />
        </div>
      ))}
      <span className="sr-only">Loading competitors table</span>
    </div>
  )
}

export function ReportsGridSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" role="status" aria-label="Loading reports">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="p-6 border rounded-lg space-y-3">
          <div className="h-4 bg-muted rounded animate-pulse w-2/3" />
          <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
          <div className="h-8 bg-muted rounded animate-pulse" />
        </div>
      ))}
      <span className="sr-only">Loading reports</span>
    </div>
  )
}

export function ScansListSkeleton() {
  return (
    <div className="space-y-4" role="status" aria-label="Loading scans list">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="p-4 border rounded-lg space-y-2">
          <div className="flex justify-between items-center">
            <div className="h-4 bg-muted rounded animate-pulse w-1/3" />
            <div className="h-4 bg-muted rounded animate-pulse w-16" />
          </div>
          <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
        </div>
      ))}
      <span className="sr-only">Loading scans list</span>
    </div>
  )
}

export function SitesListSkeleton() {
  return (
    <div className="space-y-4" role="status" aria-label="Loading websites">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="border rounded-lg p-4">
          <div className="flex items-center space-x-4">
            <div className="h-10 w-10 bg-muted rounded-full animate-pulse" />
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-muted rounded animate-pulse w-48" />
              <div className="h-3 bg-muted rounded animate-pulse w-64" />
            </div>
            <div className="hidden sm:flex space-x-4">
              <div className="h-6 w-12 bg-muted rounded animate-pulse" />
              <div className="h-6 w-16 bg-muted rounded animate-pulse" />
              <div className="h-8 w-20 bg-muted rounded animate-pulse" />
            </div>
          </div>
        </div>
      ))}
      <span className="sr-only">Loading websites</span>
    </div>
  )
}