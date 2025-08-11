import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Row { id: string; user_id: string; plan: string; status: string; current_period_end: string | null; created_at: string }

export function BillingTab() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('subscriptions')
        .select('id, user_id, plan, status, current_period_end, created_at')
        .order('created_at', { ascending: false })
        .limit(100);
      if (!error) setRows((data || []) as Row[]);
      setLoading(false);
    };
    run();
  }, []);

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Plan</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Period End</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow><TableCell colSpan={4}>Loading…</TableCell></TableRow>
          ) : rows.length === 0 ? (
            <TableRow><TableCell colSpan={4}>No subscriptions</TableCell></TableRow>
          ) : rows.map(r => (
            <TableRow key={r.id}>
              <TableCell className="font-mono text-xs">{r.user_id}</TableCell>
              <TableCell>{r.plan}</TableCell>
              <TableCell>{r.status}</TableCell>
              <TableCell>{r.current_period_end ? new Date(r.current_period_end).toLocaleString() : '—'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
