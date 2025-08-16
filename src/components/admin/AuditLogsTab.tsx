import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

interface Row { id: string; action: string; table_name: string | null; user_id: string | null; created_at: string; }

export function AuditLogsTab() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('audit_logs')
        .select('id, action, table_name, user_id, created_at')
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
            <TableHead>When</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Table</TableHead>
            <TableHead>User</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell><Skeleton className="h-4 w-64" /></TableCell>
              </TableRow>
            ))
          ) : rows.length === 0 ? (
            <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No audit logs available</TableCell></TableRow>
          ) : rows.map(r => (
            <TableRow key={r.id}>
              <TableCell>{new Date(r.created_at).toLocaleString()}</TableCell>
              <TableCell>{r.action}</TableCell>
              <TableCell>{r.table_name || '—'}</TableCell>
              <TableCell className="font-mono text-xs">{r.user_id || '—'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
