import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Row { user_id: string; scan_count: number; prompt_count: number; competitor_count: number; report_count: number; last_reset: string; }

export function UsageTab() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchRows = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('usage_metrics')
      .select('user_id, scan_count, prompt_count, competitor_count, report_count, last_reset')
      .order('user_id');
    if (error) {
      toast({ title: 'Error', description: 'Failed to fetch usage data', variant: 'destructive' });
    } else {
      setRows((data || []) as Row[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRows();
  }, []);

  const reset = async (user_id: string) => {
    const { error } = await supabase
      .from('usage_metrics')
      .update({ scan_count: 0, prompt_count: 0, competitor_count: 0, report_count: 0 })
      .eq('user_id', user_id);
    if (error) {
      toast({ title: 'Error', description: 'Failed to reset usage', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Usage reset successfully' });
      fetchRows();
    }
  };

  const totalScans = rows.reduce((sum, row) => sum + row.scan_count, 0);
  const totalPrompts = rows.reduce((sum, row) => sum + row.prompt_count, 0);
  const totalCompetitors = rows.reduce((sum, row) => sum + row.competitor_count, 0);
  const totalReports = rows.reduce((sum, row) => sum + row.report_count, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="stat-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Scans</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {loading ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold">{totalScans}</p>}
          </CardContent>
        </Card>
        
        <Card className="stat-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Prompts</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {loading ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold">{totalPrompts}</p>}
          </CardContent>
        </Card>
        
        <Card className="stat-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Competitors</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {loading ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold">{totalCompetitors}</p>}
          </CardContent>
        </Card>
        
        <Card className="stat-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Reports</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {loading ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold">{totalReports}</p>}
          </CardContent>
        </Card>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User ID</TableHead>
            <TableHead>Scans</TableHead>
            <TableHead>Prompts</TableHead>
            <TableHead>Competitors</TableHead>
            <TableHead>Reports</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-64" /></TableCell>
                <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                <TableCell><Skeleton className="h-8 w-16" /></TableCell>
              </TableRow>
            ))
          ) : rows.length === 0 ? (
            <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No usage data available</TableCell></TableRow>
          ) : rows.map(r => (
            <TableRow key={r.user_id}>
              <TableCell className="font-mono text-xs">{r.user_id}</TableCell>
              <TableCell>{r.scan_count}</TableCell>
              <TableCell>{r.prompt_count}</TableCell>
              <TableCell>{r.competitor_count}</TableCell>
              <TableCell>{r.report_count}</TableCell>
              <TableCell><Button size="sm" variant="outline" onClick={() => reset(r.user_id)}>Reset</Button></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}