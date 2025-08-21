import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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
}

export function ResponsiveTable<T extends Record<string, any>>({
  data,
  columns,
  loading,
  loadingSkeleton,
  emptyState,
  keyExtractor = (item) => item.id || Math.random().toString(),
  onRowClick,
  className
}: ResponsiveTableProps<T>) {
  const isMobile = useIsMobile();

  if (loading && loadingSkeleton) {
    return loadingSkeleton;
  }

  if (data.length === 0 && emptyState) {
    return emptyState;
  }

  if (isMobile) {
    return (
      <div className={`space-y-3 ${className}`}>
        {data.map((item) => (
          <Card 
            key={keyExtractor(item)} 
            className={`hover-scale transition-all duration-200 ${
              onRowClick ? 'cursor-pointer card-focus' : ''
            }`}
            onClick={() => onRowClick?.(item)}
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
                      <div className={`text-sm ${column.className || ''}`}>
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
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full min-w-[600px]">
        <thead>
          <tr className="border-b border-border">
            {columns.map((column) => (
              <th 
                key={column.key} 
                className={`text-left p-4 font-medium text-muted-foreground ${column.className || ''}`}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr 
              key={keyExtractor(item)}
              className={`border-b border-border hover:bg-muted/50 transition-colors ${
                onRowClick ? 'cursor-pointer' : ''
              }`}
              onClick={() => onRowClick?.(item)}
            >
              {columns.map((column) => {
                const value = item[column.key];
                const renderedValue = column.render ? column.render(value, item) : value;
                
                return (
                  <td key={column.key} className={`p-4 ${column.className || ''}`}>
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
export function TableBadge({ variant, children }: { variant?: any; children: React.ReactNode }) {
  return <Badge variant={variant}>{children}</Badge>;
}

export function TableDate({ date }: { date: string }) {
  return <span className="text-sm text-muted-foreground">{new Date(date).toLocaleDateString()}</span>;
}

export function TableText({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={className}>{children}</span>;
}