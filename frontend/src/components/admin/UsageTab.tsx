import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

interface Row { user_id: string; scan_count: number; prompt_count: number; competitor_count: number; report_count: number; }

export function UsageTab() {
  const { toast } = useToast();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRows = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('usage_metrics')
      .select('user_id, scan_count, prompt_count, competitor_count, report_count')
      .order('created_at', { ascending: false });
    if (error) {
      toast({ title: 'Error', description: 'Failed to load usage', variant: 'destructive' });
    } else {
      setRows((data || []) as Row[]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchRows(); }, []);

  const reset = async (user_id: string) => {
    const { error } = await supabase
      .from('usage_metrics')
      .update({ scan_count: 0, prompt_count: 0, competitor_count: 0, report_count: 0 })
      .eq('user_id', user_id);
    if (error) toast({ title: 'Error', description: 'Failed to reset', variant: 'destructive' });
    else { toast({ title: 'Reset', description: 'Usage reset' }); fetchRows(); }
  };

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User ID</TableHead>
            <TableHead>Scans</TableHead>
            <TableHead>Prompts</TableHead>
            <TableHead>Competitors</TableHead>
            <TableHead>Reports</TableHead>
            <TableHead className="w-[100px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow><TableCell colSpan={6}>Loading…</TableCell></TableRow>
          ) : rows.length === 0 ? (
            <TableRow><TableCell colSpan={6}>No usage rows</TableCell></TableRow>
          ) : rows.map((r) => (
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
