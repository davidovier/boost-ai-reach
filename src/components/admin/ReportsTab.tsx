import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Row { id: string; pdf_url: string | null; site_id: string | null; created_at: string; }

export function ReportsTab() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('reports')
        .select('id, pdf_url, site_id, created_at')
        .order('created_at', { ascending: false })
        .limit(50);
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
            <TableHead>ID</TableHead>
            <TableHead>PDF</TableHead>
            <TableHead>Site</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow><TableCell colSpan={4}>Loading…</TableCell></TableRow>
          ) : rows.length === 0 ? (
            <TableRow><TableCell colSpan={4}>No reports</TableCell></TableRow>
          ) : rows.map(r => (
            <TableRow key={r.id}>
              <TableCell className="font-mono text-xs">{r.id}</TableCell>
              <TableCell>{r.pdf_url ? <a className="text-primary underline" href={r.pdf_url} target="_blank" rel="noreferrer">Open</a> : '—'}</TableCell>
              <TableCell className="font-mono text-xs">{r.site_id || '—'}</TableCell>
              <TableCell>{new Date(r.created_at).toLocaleString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
