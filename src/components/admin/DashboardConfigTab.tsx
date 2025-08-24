import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface Row { id: string; role: string | null; plan: string | null; config: any; }

export function DashboardConfigTab() {
  const { toast } = useToast();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Record<string, string>>({});

  const fetchRows = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('dashboard_configs')
      .select('id, role, plan, config')
      .order('created_at', { ascending: false });
    if (!error) setRows((data || []) as Row[]);
    setLoading(false);
  };

  useEffect(() => { fetchRows(); }, []);

  const save = async (id: string) => {
    try {
      const text = editing[id] ?? '';
      const parsed = JSON.parse(text);
      const { error } = await supabase.from('dashboard_configs').update({ config: parsed }).eq('id', id);
      if (error) throw error;
      toast({ title: 'Saved', description: 'Configuration updated' });
      setEditing((e) => ({ ...e, [id]: '' }));
      fetchRows();
    } catch (e: any) {
      toast({ title: 'Invalid JSON', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      {loading ? (
        <p>Loading…</p>
      ) : rows.length === 0 ? (
        <p>No dashboard configs</p>
      ) : (
        rows.map((r) => (
          <div key={r.id} className="rounded border border-border p-4">
            <div className="text-sm text-muted-foreground mb-2">Role: {r.role || 'any'} · Plan: {r.plan || 'any'}</div>
            <textarea
              className="w-full h-40 rounded border border-border bg-background p-2 font-mono text-sm"
              value={editing[r.id] ?? JSON.stringify(r.config, null, 2)}
              onChange={(e) => setEditing((prev) => ({ ...prev, [r.id]: e.target.value }))}
            />
            <div className="flex justify-end mt-2">
              <Button size="sm" onClick={() => save(r.id)}>Save</Button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
