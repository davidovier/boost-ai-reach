import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users,
  Search,
  Filter,
  Download,
  MoreVertical,
  Edit,
  UserCheck,
  UserX,
  Trash2,
  Mail,
  Calendar,
  Crown,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface Profile {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'manager' | 'admin';
  plan: 'free' | 'pro' | 'max';
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
}

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  unconfirmedUsers: number;
  adminUsers: number;
  revenueUsers: number;
}

export function EnhancedUsersTab() {
  const { toast } = useToast();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);

  // User statistics
  const userStats: UserStats = useMemo(() => {
    return {
      totalUsers: users.length,
      activeUsers: users.filter(u => u.last_sign_in_at).length,
      unconfirmedUsers: users.filter(u => !u.email_confirmed_at).length,
      adminUsers: users.filter(u => u.role === 'admin').length,
      revenueUsers: users.filter(u => u.plan === 'pro' || u.plan === 'max').length
    };
  }, [users]);

  // Filtered and paginated users
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = !searchTerm || 
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      const matchesPlan = planFilter === 'all' || user.plan === planFilter;
      
      let matchesStatus = true;
      if (statusFilter === 'confirmed') matchesStatus = !!user.email_confirmed_at;
      if (statusFilter === 'unconfirmed') matchesStatus = !user.email_confirmed_at;
      if (statusFilter === 'active') matchesStatus = !!user.last_sign_in_at;
      
      return matchesSearch && matchesRole && matchesPlan && matchesStatus;
    });
  }, [users, searchTerm, roleFilter, planFilter, statusFilter]);

  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredUsers.slice(startIndex, startIndex + pageSize);
  }, [filteredUsers, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredUsers.length / pageSize);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, name, role, plan, created_at, last_sign_in_at, email_confirmed_at')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setUsers(data || []);
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: (error as Error)?.message || 'Failed to fetch users',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUserUpdate = async (userId: string, updates: Partial<Profile>) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);

      if (error) throw error;

      setUsers(users.map(user => 
        user.id === userId ? { ...user, ...updates } : user
      ));

      toast({
        title: 'User updated',
        description: 'User information has been updated successfully',
      });

      setEditingUser(null);
    } catch (error: unknown) {
      toast({
        title: 'Update failed',
        description: (error as Error)?.message || 'Failed to update user',
        variant: 'destructive',
      });
    }
  };

  const handleBulkRoleUpdate = async (newRole: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .in('id', Array.from(selectedUsers));

      if (error) throw error;

      setUsers(users.map(user => 
        selectedUsers.has(user.id) ? { ...user, role: newRole as Profile['role'] } : user
      ));

      toast({
        title: 'Bulk update completed',
        description: `Updated role for ${selectedUsers.size} users`,
      });

      setSelectedUsers(new Set());
      setShowBulkActions(false);
    } catch (error: unknown) {
      toast({
        title: 'Bulk update failed',
        description: (error as Error)?.message || 'Failed to update users',
        variant: 'destructive',
      });
    }
  };

  const handleSelectUser = (userId: string, checked: boolean) => {
    const newSelected = new Set(selectedUsers);
    if (checked) {
      newSelected.add(userId);
    } else {
      newSelected.delete(userId);
    }
    setSelectedUsers(newSelected);
    setShowBulkActions(newSelected.size > 0);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(new Set(paginatedUsers.map(u => u.id)));
      setShowBulkActions(true);
    } else {
      setSelectedUsers(new Set());
      setShowBulkActions(false);
    }
  };

  const exportUsers = () => {
    const csvData = [
      ['Email', 'Name', 'Role', 'Plan', 'Created', 'Last Sign In', 'Status'],
      ...filteredUsers.map(user => [
        user.email,
        user.name || '',
        user.role,
        user.plan,
        format(new Date(user.created_at), 'yyyy-MM-dd'),
        user.last_sign_in_at ? format(new Date(user.last_sign_in_at), 'yyyy-MM-dd') : 'Never',
        user.email_confirmed_at ? 'Confirmed' : 'Unconfirmed'
      ])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `users-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'manager': return 'default';
      default: return 'secondary';
    }
  };

  const getPlanBadgeVariant = (plan: string) => {
    switch (plan) {
      case 'max': return 'default';
      case 'pro': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusIcon = (user: Profile) => {
    if (!user.email_confirmed_at) return <UserX className="h-4 w-4 text-red-500" />;
    if (!user.last_sign_in_at) return <Mail className="h-4 w-4 text-yellow-500" />;
    return <UserCheck className="h-4 w-4 text-green-500" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-e-transparent" />
          <p className="mt-2 text-muted-foreground">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* User Statistics */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div className="text-sm font-medium text-muted-foreground">Total</div>
            </div>
            <div className="text-2xl font-bold">{userStats.totalUsers}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div className="text-sm font-medium text-muted-foreground">Active</div>
            </div>
            <div className="text-2xl font-bold text-green-600">{userStats.activeUsers}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <div className="text-sm font-medium text-muted-foreground">Unconfirmed</div>
            </div>
            <div className="text-2xl font-bold text-yellow-600">{userStats.unconfirmedUsers}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Crown className="h-4 w-4 text-purple-600" />
              <div className="text-sm font-medium text-muted-foreground">Paying</div>
            </div>
            <div className="text-2xl font-bold text-purple-600">{userStats.revenueUsers}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <UserCheck className="h-4 w-4 text-red-600" />
              <div className="text-sm font-medium text-muted-foreground">Admins</div>
            </div>
            <div className="text-2xl font-bold text-red-600">{userStats.adminUsers}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              User Management ({filteredUsers.length})
            </span>
            <Button onClick={exportUsers} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by email or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plans</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
                <SelectItem value="max">Max</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="unconfirmed">Unconfirmed</SelectItem>
                <SelectItem value="active">Active</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bulk Actions */}
          {showBulkActions && (
            <Alert className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>{selectedUsers.size} users selected</span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleBulkRoleUpdate('user')}>
                    Set as User
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleBulkRoleUpdate('manager')}>
                    Set as Manager
                  </Button>
                  <Button size="sm" onClick={() => setSelectedUsers(new Set())}>
                    Clear Selection
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Users Table */}
          <div className="border rounded-lg">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="p-3 text-left">
                      <Checkbox 
                        checked={selectedUsers.size === paginatedUsers.length && paginatedUsers.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </th>
                    <th className="p-3 text-left font-medium">User</th>
                    <th className="p-3 text-left font-medium">Role</th>
                    <th className="p-3 text-left font-medium">Plan</th>
                    <th className="p-3 text-left font-medium">Status</th>
                    <th className="p-3 text-left font-medium">Joined</th>
                    <th className="p-3 text-left font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-muted/25">
                      <td className="p-3">
                        <Checkbox 
                          checked={selectedUsers.has(user.id)}
                          onCheckedChange={(checked) => handleSelectUser(user.id, !!checked)}
                        />
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(user)}
                          <div>
                            <div className="font-medium">{user.email}</div>
                            {user.name && (
                              <div className="text-sm text-muted-foreground">{user.name}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                          {user.role}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Badge variant={getPlanBadgeVariant(user.plan)}>
                          {user.plan}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="text-sm">
                          {user.email_confirmed_at ? (
                            <span className="text-green-600">Confirmed</span>
                          ) : (
                            <span className="text-red-600">Unconfirmed</span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {user.last_sign_in_at 
                            ? `Last: ${format(new Date(user.last_sign_in_at), 'MMM d')}`
                            : 'Never signed in'
                          }
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-sm">
                          {format(new Date(user.created_at), 'MMM d, yyyy')}
                        </div>
                      </td>
                      <td className="p-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingUser(user)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredUsers.length)} of {filteredUsers.length} users
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      {editingUser && (
        <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>
                Update user role and plan settings
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={editingUser.email} disabled />
              </div>
              <div className="space-y-2">
                <Label>Name</Label>
                <Input 
                  value={editingUser.name || ''} 
                  onChange={(e) => setEditingUser({...editingUser, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select 
                  value={editingUser.role}
                  onValueChange={(value) => setEditingUser({...editingUser, role: value as Profile['role']})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Plan</Label>
                <Select 
                  value={editingUser.plan}
                  onValueChange={(value) => setEditingUser({...editingUser, plan: value as Profile['plan']})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                    <SelectItem value="max">Max</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => handleUserUpdate(editingUser.id, editingUser)}>
                  Save Changes
                </Button>
                <Button variant="outline" onClick={() => setEditingUser(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}