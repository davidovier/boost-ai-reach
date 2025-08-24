import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Column<T> {
  key: string;
  label: string;
  render?: (value: any, item: T) => React.ReactNode;
  hideOnMobile?: boolean;
  className?: string;
}

interface ResponsiveTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  loadingSkeleton?: React.ReactNode;
  emptyState?: React.ReactNode;
  keyExtractor?: (item: T) => string;
  onRowClick?: (item: T) => void;
  className?: string;
  caption?: string;
  "aria-label"?: string;
}

export function ResponsiveTable<T extends Record<string, any>>({
  data,
  columns,
  loading,
  loadingSkeleton,
  emptyState,
  keyExtractor = (item) => item.id || Math.random().toString(),
  onRowClick,
  className,
  caption,
  "aria-label": ariaLabel
}: ResponsiveTableProps<T>) {
  const isMobile = useIsMobile();

  if (loading && loadingSkeleton) {
    return (
      <div role="status" aria-live="polite" aria-label="Loading table data">
        {loadingSkeleton}
      </div>
    );
  }

  if (data.length === 0 && emptyState) {
    return (
      <div role="status" aria-live="polite" aria-label="No data available">
        {emptyState}
      </div>
    );
  }

  if (isMobile) {
    return (
      <div 
        className={cn("space-y-3", className)}
        role="region"
        aria-label={ariaLabel || "Data cards"}
      >
        {data.map((item, index) => (
          <Card 
            key={keyExtractor(item)} 
            className={cn(
              "hover-scale transition-all duration-200", 
              onRowClick && "cursor-pointer card-focus"
            )}
            onClick={() => onRowClick?.(item)}
            role={onRowClick ? "button" : undefined}
            tabIndex={onRowClick ? 0 : undefined}
            onKeyDown={(e) => {
              if (onRowClick && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                onRowClick(item);
              }
            }}
            aria-label={onRowClick ? `View details for row ${index + 1}` : undefined}
          >
            <CardContent className="p-4 space-y-3">
              {columns
                .filter(col => !col.hideOnMobile)
                .map((column) => {
                  const value = item[column.key];
                  const renderedValue = column.render ? column.render(value, item) : value;
                  
                  return (
                    <div key={column.key} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">
                        {column.label}:
                      </span>
                      <div className={cn("text-sm", column.className)}>
                        {renderedValue}
                      </div>
                    </div>
                  );
                })}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div 
      className={cn("overflow-x-auto", className)}
      role="region"
      aria-label={ariaLabel || "Data table"}
      tabIndex={0}
    >
      <table className="w-full min-w-[600px]" role="table">
        {caption && (
          <caption className="sr-only">
            {caption}
          </caption>
        )}
        <thead>
          <tr className="border-b border-border">
            {columns.map((column) => (
              <th 
                key={column.key} 
                className={cn(
                  "text-left p-4 font-medium text-muted-foreground",
                  column.className
                )}
                scope="col"
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr 
              key={keyExtractor(item)}
              className={cn(
                "border-b border-border hover:bg-muted/50 transition-colors",
                onRowClick && "cursor-pointer focus-within:bg-muted/50"
              )}
              onClick={() => onRowClick?.(item)}
              role={onRowClick ? "button" : undefined}
              tabIndex={onRowClick ? 0 : undefined}
              onKeyDown={(e) => {
                if (onRowClick && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  onRowClick(item);
                }
              }}
              aria-label={onRowClick ? `View details for row ${index + 1}` : undefined}
            >
              {columns.map((column) => {
                const value = item[column.key];
                const renderedValue = column.render ? column.render(value, item) : value;
                
                return (
                  <td 
                    key={column.key} 
                    className={cn("p-4", column.className)}
                  >
                    {renderedValue}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Helper components for common table cell types
export function TableBadge({ 
  variant, 
  children, 
  "aria-label": ariaLabel 
}: { 
  variant?: any; 
  children: React.ReactNode;
  "aria-label"?: string;
}) {
  return (
    <Badge variant={variant} aria-label={ariaLabel}>
      {children}
    </Badge>
  );
}

export function TableDate({ 
  date, 
  format = 'short' 
}: { 
  date: string;
  format?: 'short' | 'long';
}) {
  const dateObj = new Date(date);
  const formattedDate = format === 'long' 
    ? dateObj.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    : dateObj.toLocaleDateString();
    
  return (
    <time 
      dateTime={date}
      className="text-sm text-muted-foreground"
    >
      {formattedDate}
    </time>
  );
}

export function TableText({ 
  children, 
  className,
  "aria-label": ariaLabel
}: { 
  children: React.ReactNode; 
  className?: string;
  "aria-label"?: string;
}) {
  return (
    <span className={className} aria-label={ariaLabel}>
      {children}
    </span>
  );
}