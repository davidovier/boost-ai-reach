import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SEO } from '@/components/SEO';
import { withAdminGuard } from '@/components/auth/withRoleGuard';
import { ChevronLeft, ChevronRight, Search, Filter } from 'lucide-react';

const roles = ['user', 'manager', 'admin'] as const;
const plans = ['free', 'pro', 'growth', 'enterprise'] as const;

type Role = typeof roles[number];
type Plan = typeof plans[number];

interface UserRow {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  plan: Plan;
  created_at: string;
  usage?: {
    scan_count: number;
    prompt_count: number;
    competitor_count: number;
    report_count: number;
  };
}

function AdminUsersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const { toast } = useToast();

  // Pagination and filtering state
  const page = parseInt(searchParams.get('page') || '1');
  const limit = 20;
  const emailFilter = searchParams.get('email') || '';
  const roleFilter = searchParams.get('role') || '';
  const planFilter = searchParams.get('plan') || '';

  const fetchUsers = async () => {
    setLoading(true);
    let query = supabase
      .from('profiles')
      .select(`
        id,
        email,
        name,
        role,
        plan,
        created_at,
        usage_metrics(scan_count, prompt_count, competitor_count, report_count)
      `, { count: 'exact' });

    // Apply filters
    if (emailFilter) {
      query = query.ilike('email', `%${emailFilter}%`);
    }
    if (roleFilter && roles.includes(roleFilter as Role)) {
      query = query.eq('role', roleFilter as Role);
    }
    if (planFilter && plans.includes(planFilter as Plan)) {
      query = query.eq('plan', planFilter as Plan);
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to).order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      toast({ title: 'Error', description: 'Failed to fetch users', variant: 'destructive' });
    } else {
      const usersWithUsage: UserRow[] = (data || []).map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        plan: user.plan,
        created_at: user.created_at,
        usage: Array.isArray(user.usage_metrics) && user.usage_metrics.length > 0 
          ? user.usage_metrics[0] 
          : { scan_count: 0, prompt_count: 0, competitor_count: 0, report_count: 0 }
      }));
      setUsers(usersWithUsage);
      setTotalCount(count || 0);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, [page, emailFilter, roleFilter, planFilter]);

  const updateUserRole = async (userId: string, newRole: Role) => {
    setUpdating(userId);
    
    // Optimistic update
    setUsers(prev => prev.map(user => 
      user.id === userId ? { ...user, role: newRole } : user
    ));

    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);

    if (error) {
      // Revert optimistic update
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, role: user.role } : user
      ));
      toast({ title: 'Error', description: 'Failed to update user role', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'User role updated successfully' });
    }
    setUpdating(null);
  };

  const updateFilter = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    newParams.set('page', '1'); // Reset to first page when filtering
    setSearchParams(newParams);
  };

  const updatePage = (newPage: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', newPage.toString());
    setSearchParams(newParams);
  };

  const totalPages = Math.ceil(totalCount / limit);
  const startIndex = (page - 1) * limit + 1;
  const endIndex = Math.min(page * limit, totalCount);

  const getRoleBadgeVariant = (role: Role) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'manager': return 'default';
      default: return 'secondary';
    }
  };

  const getPlanBadgeVariant = (plan: Plan) => {
    switch (plan) {
      case 'enterprise': return 'default';
      case 'growth': return 'secondary';
      case 'pro': return 'outline';
      default: return 'secondary';
    }
  };

  return (
    <>
      <SEO 
        title="User Management - Admin Panel - FindableAI"
        description="Manage user accounts, roles, and permissions in the FindableAI admin panel."
        url="/admin/users"
        noindex={true}
      />
      
      <div className="space-y-6">
        <header>
          <h1 className="text-3xl font-bold text-foreground">User Management</h1>
          <p className="text-muted-foreground">Manage user accounts, roles, and permissions</p>
        </header>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="stat-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {loading ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold">{totalCount}</p>}
            </CardContent>
          </Card>
          
          <Card className="stat-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Admins</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {loading ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold">{users.filter(u => u.role === 'admin').length}</p>}
            </CardContent>
          </Card>
          
          <Card className="stat-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Managers</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {loading ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold">{users.filter(u => u.role === 'manager').length}</p>}
            </CardContent>
          </Card>
          
          <Card className="stat-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Regular Users</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {loading ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold">{users.filter(u => u.role === 'user').length}</p>}
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by email..."
                  value={emailFilter}
                  onChange={(e) => updateFilter('email', e.target.value)}
                  className="pl-10 focus-ring"
                />
              </div>
              
              <Select value={roleFilter} onValueChange={(value) => updateFilter('role', value)}>
                <SelectTrigger className="focus-ring">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All roles</SelectItem>
                  {roles.map(role => (
                    <SelectItem key={role} value={role}>{role}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={planFilter} onValueChange={(value) => updateFilter('plan', value)}>
                <SelectTrigger className="focus-ring">
                  <SelectValue placeholder="Filter by plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All plans</SelectItem>
                  {plans.map(plan => (
                    <SelectItem key={plan} value={plan}>{plan}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Usage (S/P/C/R)</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: limit }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    </TableRow>
                  ))
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.email}</TableCell>
                      <TableCell>{user.name || '—'}</TableCell>
                      <TableCell>
                        <Select 
                          value={user.role} 
                          onValueChange={(value: Role) => updateUserRole(user.id, value)}
                          disabled={updating === user.id}
                        >
                          <SelectTrigger className="w-24 focus-ring">
                            <Badge variant={getRoleBadgeVariant(user.role) as any}>
                              {user.role}
                            </Badge>
                          </SelectTrigger>
                          <SelectContent>
                            {roles.map(role => (
                              <SelectItem key={role} value={role}>
                                <Badge variant={getRoleBadgeVariant(role) as any}>
                                  {role}
                                </Badge>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getPlanBadgeVariant(user.plan) as any}>
                          {user.plan}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {user.usage ? 
                          `${user.usage.scan_count}/${user.usage.prompt_count}/${user.usage.competitor_count}/${user.usage.report_count}` 
                          : '—'
                        }
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <Card>
            <CardContent className="flex items-center justify-between py-4">
              <div className="text-sm text-muted-foreground">
                Showing {startIndex}-{endIndex} of {totalCount} users
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updatePage(page - 1)}
                  disabled={page === 1}
                  className="btn-focus"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                    return (
                      <Button
                        key={pageNum}
                        variant={pageNum === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => updatePage(pageNum)}
                        className="w-8 btn-focus"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updatePage(page + 1)}
                  disabled={page === totalPages}
                  className="btn-focus"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}

export default withAdminGuard(AdminUsersPage);