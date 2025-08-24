import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserRoleModal } from './UserRoleModal';
import { Search, Filter, Users, X, Edit3 } from 'lucide-react';

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
  const [filteredRows, setFilteredRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  
  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');
  
  // Modal state
  const [modalUser, setModalUser] = useState<Row | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  // Filter logic
  useEffect(() => {
    let filtered = rows;

    if (searchTerm) {
      filtered = filtered.filter(row => 
        row.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (row.name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
      );
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter(row => row.role === roleFilter);
    }

    if (planFilter !== 'all') {
      filtered = filtered.filter(row => row.plan === planFilter);
    }

    setFilteredRows(filtered);
  }, [rows, searchTerm, roleFilter, planFilter]);

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
      toast({ title: 'Saved', description: 'User updated successfully' });
      fetchRows();
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setRoleFilter('all');
    setPlanFilter('all');
  };

  const activeFiltersCount = [
    searchTerm,
    roleFilter !== 'all' ? roleFilter : null,
    planFilter !== 'all' ? planFilter : null
  ].filter(Boolean).length;

  const openModal = (user: Row) => {
    setModalUser(user);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalUser(null);
  };

  return (
    <>
      <div className="users-tab-container">
        {/* Filter Banner */}
        {activeFiltersCount > 0 && (
          <div className="filter-banner">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-primary" />
              <span className="font-medium">
                {activeFiltersCount} filter{activeFiltersCount > 1 ? 's' : ''} active
              </span>
              <Badge variant="outline" className="ml-2">
                {filteredRows.length} result{filteredRows.length !== 1 ? 's' : ''}
              </Badge>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearFilters}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4 mr-1" />
              Clear all
            </Button>
          </div>
        )}

        {/* Filters */}
        <div className="users-filters">
          <div className="search-filter">
            <Search className="search-icon" />
            <Input
              placeholder="Search by email or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="select-filters">
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {roles.map((role) => (
                  <SelectItem key={role} value={role}>
                    <span className="capitalize">{role}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plans</SelectItem>
                {plans.map((plan) => (
                  <SelectItem key={plan} value={plan}>
                    <span className="capitalize">{plan}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Users Table */}
        <div className="users-table-container">
          <Table>
            <TableHeader className="sticky-header">
              <TableRow>
                <TableHead className="w-[300px]">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    User
                  </div>
                </TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                    </TableCell>
                    <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-16" /></TableCell>
                  </TableRow>
                ))
              ) : filteredRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Users className="w-8 h-8" />
                      <p>No users found</p>
                      {activeFiltersCount > 0 && (
                        <Button variant="outline" size="sm" onClick={clearFilters}>
                          Clear filters
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredRows.map((user) => (
                  <TableRow key={user.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium text-foreground">{user.email}</div>
                        <div className="text-sm text-muted-foreground">
                          {user.name || 'No name provided'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={user.role === 'admin' ? 'destructive' : user.role === 'manager' ? 'default' : 'secondary'}
                        className="capitalize"
                      >
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={user.plan === 'enterprise' ? 'destructive' : user.plan === 'growth' ? 'default' : 'outline'}
                        className="capitalize"
                      >
                        {user.plan}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </TableCell>
                    <TableCell>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => openModal(user)}
                        disabled={savingId === user.id}
                        className="hover:bg-primary/10 hover:text-primary"
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Role Editing Modal */}
      <UserRoleModal
        isOpen={isModalOpen}
        onClose={closeModal}
        user={modalUser}
        onSave={updateRow}
        isSaving={savingId !== null}
      />
    </>
  );
}