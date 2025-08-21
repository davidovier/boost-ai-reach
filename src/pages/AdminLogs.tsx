import { useState, useEffect } from 'react';
import { withAdminGuard } from '@/components/auth/withRoleGuard';
import { SEO } from '@/components/SEO';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ResponsiveTable, TableBadge } from '@/components/ui/responsive-table';
import { supabase } from '@/integrations/supabase/client';
import { Download, Copy, Search, Calendar, User, Activity } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO, subDays } from 'date-fns';

interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  table_name: string | null;
  record_id: string | null;
  old_values: any;
  new_values: any;
  ip_address: unknown;
  user_agent: unknown;
  created_at: string;
  user_email?: string;
}

function AdminLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState(() => format(subDays(new Date(), 7), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [actionFilter, setActionFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [logs, dateFrom, dateTo, actionFilter, userFilter]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      
      // First get audit logs
      const { data: auditData, error: auditError } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (auditError) throw auditError;

      // Get unique user IDs to fetch profile info
      const userIds = [...new Set(auditData?.filter(log => log.user_id).map(log => log.user_id))];
      
      let userProfiles: { [key: string]: string } = {};
      if (userIds.length > 0) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, email')
          .in('id', userIds);
        
        userProfiles = Object.fromEntries(
          profileData?.map(profile => [profile.id, profile.email]) || []
        );
      }

      // Combine logs with user emails
      const logsWithUsers = auditData?.map(log => ({
        ...log,
        user_email: log.user_id ? userProfiles[log.user_id] || 'Unknown User' : 'System'
      })) || [];

      setLogs(logsWithUsers);
    } catch (error) {
      console.error('Error fetching logs:', error);
      toast({
        title: "Error",
        description: "Failed to fetch audit logs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = logs;

    // Date range filter
    if (dateFrom) {
      filtered = filtered.filter(log => 
        new Date(log.created_at) >= new Date(dateFrom + 'T00:00:00')
      );
    }
    if (dateTo) {
      filtered = filtered.filter(log => 
        new Date(log.created_at) <= new Date(dateTo + 'T23:59:59')
      );
    }

    // Action filter
    if (actionFilter !== 'all') {
      filtered = filtered.filter(log => log.action === actionFilter);
    }

    // User filter
    if (userFilter.trim()) {
      const searchTerm = userFilter.toLowerCase();
      filtered = filtered.filter(log => 
        log.user_email?.toLowerCase().includes(searchTerm) ||
        log.user_id?.toLowerCase().includes(searchTerm)
      );
    }

    setFilteredLogs(filtered);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied",
        description: "Log entry copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const exportToCsv = () => {
    const headers = ['Date', 'User', 'Action', 'Table', 'Record ID', 'IP Address', 'Old Values', 'New Values'];
    const csvData = filteredLogs.map(log => [
      format(parseISO(log.created_at), 'yyyy-MM-dd HH:mm:ss'),
      log.user_email || 'System',
      log.action,
      log.table_name || '',
      log.record_id || '',
      (log.ip_address as string) || '',
      JSON.stringify(log.old_values || {}),
      JSON.stringify(log.new_values || {})
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `audit-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export Complete",
      description: "Audit logs exported to CSV",
    });
  };

  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case 'INSERT': return 'default';
      case 'UPDATE': return 'secondary';
      case 'DELETE': return 'destructive';
      case 'role_change': return 'outline';
      default: return 'secondary';
    }
  };

  const uniqueActions = [...new Set(logs.map(log => log.action))];

  return (
    <>
      <SEO
        title="Audit Logs - Admin Panel"
        description="View and manage system audit logs"
        noindex
      />
      
      <div className="space-y-6">
        <header>
          <h1 className="text-3xl font-bold text-foreground">Audit Logs</h1>
          <p className="text-muted-foreground">Monitor system activity and user actions</p>
        </header>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Filters
            </CardTitle>
            <CardDescription>Filter and search audit logs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  From Date
                </label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  To Date
                </label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Action
                </label>
                <Select value={actionFilter} onValueChange={setActionFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All actions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    {uniqueActions.map(action => (
                      <SelectItem key={action} value={action}>
                        {action.replace('_', ' ').toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4" />
                  User
                </label>
                <Input
                  placeholder="Search by email or ID..."
                  value={userFilter}
                  onChange={(e) => setUserFilter(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 mt-4">
              <Button onClick={exportToCsv} variant="outline" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export CSV ({filteredLogs.length} records)
              </Button>
              <Button onClick={fetchLogs} variant="outline">
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle>Audit Log Entries</CardTitle>
            <CardDescription>
              Showing {filteredLogs.length} of {logs.length} log entries
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveTable
              data={filteredLogs}
              loading={loading}
              columns={[
                {
                  key: 'created_at',
                  label: 'Date/Time',
                  render: (date) => (
                    <span className="font-mono text-sm">
                      {format(parseISO(date), 'MMM dd, yyyy HH:mm:ss')}
                    </span>
                  )
                },
                {
                  key: 'user_email',
                  label: 'User',
                  render: (email, log) => (
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{email}</span>
                      {log.user_id && (
                        <span className="text-xs text-muted-foreground font-mono">
                          {log.user_id.slice(0, 8)}...
                        </span>
                      )}
                    </div>
                  )
                },
                {
                  key: 'action',
                  label: 'Action',
                  render: (action) => (
                    <TableBadge variant={getActionBadgeVariant(action)}>
                      {action.replace('_', ' ').toUpperCase()}
                    </TableBadge>
                  )
                },
                {
                  key: 'table_name',
                  label: 'Target',
                  render: (tableName, log) => (
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{tableName || 'N/A'}</span>
                      {log.record_id && (
                        <span className="text-xs text-muted-foreground font-mono">
                          {log.record_id.slice(0, 8)}...
                        </span>
                      )}
                    </div>
                  ),
                  hideOnMobile: true
                },
                {
                  key: 'details',
                  label: 'Details',
                  render: (_, log) => (
                    <div className="space-y-1 max-w-xs">
                      {log.old_values && Object.keys(log.old_values).length > 0 && (
                        <div className="text-xs">
                          <span className="text-muted-foreground">Old: </span>
                          <code className="font-mono bg-muted px-1 rounded">
                            {JSON.stringify(log.old_values).slice(0, 50)}...
                          </code>
                        </div>
                      )}
                      {log.new_values && Object.keys(log.new_values).length > 0 && (
                        <div className="text-xs">
                          <span className="text-muted-foreground">New: </span>
                          <code className="font-mono bg-muted px-1 rounded">
                            {JSON.stringify(log.new_values).slice(0, 50)}...
                          </code>
                        </div>
                      )}
                    </div>
                  ),
                  hideOnMobile: true
                },
                {
                  key: 'ip_address',
                  label: 'IP',
                  render: (ip) => (
                    <span className="font-mono text-xs text-muted-foreground">
                      {(ip as string) || 'N/A'}
                    </span>
                  ),
                  hideOnMobile: true
                },
                {
                  key: 'actions',
                  label: '',
                  render: (_, log) => (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(JSON.stringify(log, null, 2))}
                      className="btn-focus opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Copy log entry"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  ),
                  className: 'w-[50px]'
                }
              ]}
              emptyState={
                <div className="text-center py-8 text-muted-foreground">
                  No audit logs found matching your filters
                </div>
              }
              loadingSkeleton={
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              }
              className="[&_tbody_tr]:group"
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export default withAdminGuard(AdminLogsPage);