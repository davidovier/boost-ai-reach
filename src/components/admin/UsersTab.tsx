import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

const roles = ['user','manager','admin'] as const;
const plans = ['free','pro','growth','enterprise'] as const;

type Role = typeof roles[number];
 type Plan = typeof plans[number];

type Row = {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  plan: Plan;
  created_at: string;
};

export function UsersTab() {
  const { toast } = useToast();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const fetchRows = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, name, role, plan, created_at')
      .order('created_at', { ascending: false });
    if (error) {
      toast({ title: 'Error', description: 'Failed to load users', variant: 'destructive' });
    } else {
      setRows((data || []) as Row[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRows();
  }, []);

  const updateRow = async (id: string, patch: { role?: Role; plan?: Plan }) => {
    setSavingId(id);
    const { error } = await supabase
      .from('profiles')
      .update(patch)
      .eq('id', id);
    setSavingId(null);
    if (error) {
      toast({ title: 'Error', description: 'Failed to update user', variant: 'destructive' });
    } else {
      toast({ title: 'Saved', description: 'User updated' });
      fetchRows();
    }
  };

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Plan</TableHead>
            <TableHead className="w-[100px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                <TableCell><Skeleton className="h-8 w-16" /></TableCell>
              </TableRow>
            ))
          ) : rows.length === 0 ? (
            <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No users found</TableCell></TableRow>
          ) : rows.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="font-medium">{r.email}</TableCell>
              <TableCell>{r.name || '—'}</TableCell>
              <TableCell>
                <select
                  className="bg-transparent border rounded px-2 py-1"
                  value={r.role}
                  onChange={(e) => updateRow(r.id, { role: e.target.value as Role })}
                  aria-label={`Role for ${r.email}`}
                >
                  {roles.map((ro) => <option key={ro} value={ro}>{ro}</option>)}
                </select>
              </TableCell>
              <TableCell>
                <select
                  className="bg-transparent border rounded px-2 py-1"
                  value={r.plan}
                  onChange={(e) => updateRow(r.id, { plan: e.target.value as Plan })}
                  aria-label={`Plan for ${r.email}`}
                >
                  {plans.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </TableCell>
              <TableCell>
                <Button size="sm" onClick={() => updateRow(r.id, { role: r.role, plan: r.plan })} disabled={savingId===r.id}>Save</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
