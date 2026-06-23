import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  Activity,
  Search,
  Filter,
  RefreshCw,
  Loader2,
  Calendar,
  Clock,
  User,
  FileEdit,
  FilePlus,
  Forward,
  Trash2,
  LogIn,
  LogOut,
  Download,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAppConfig } from '@/hooks/useAppConfig';
import {
  ActivityLogEntry,
  UserStats,
  fetchActivityLogs,
  fetchUserStats,
  fetchOnlineUsers
} from '@/hooks/useActivityLog';

export default function ActivityLog() {
  const { userRole, isAdmin } = useAuth();
  const isAdminUser = userRole === 'admin' || isAdmin;
  const { sections } = useAppConfig();

  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [stats, setStats] = useState<UserStats[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);

  // Filters
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [filterUser, setFilterUser] = useState('all');
  const [filterAction, setFilterAction] = useState('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [logsRes, statsRes, onlineRes] = await Promise.all([
        fetchActivityLogs({
          page,
          search,
          userRole: filterUser,
          action: filterAction,
          dateFrom: filterDateFrom,
          dateTo: filterDateTo,
          pageSize: 50
        }),
        fetchUserStats(),
        fetchOnlineUsers()
      ]);

      setLogs(logsRes.data);
      setTotalRecords(logsRes.total);
      setStats(statsRes);
      setOnlineUsers(onlineRes);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load activity data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdminUser) {
      loadData();
    }
  }, [page, search, filterUser, filterAction, filterDateFrom, filterDateTo, isAdminUser]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Fetch all matching records without pagination for export
      const res = await fetchActivityLogs({
        search,
        userRole: filterUser,
        action: filterAction,
        dateFrom: filterDateFrom,
        dateTo: filterDateTo,
        pageSize: 10000 // Get up to 10k records
      });

      if (res.data.length === 0) {
        toast.error("No records to export");
        return;
      }

      // Format CSV
      const headers = ['Date', 'Time', 'User Role', 'User Name', 'Action', 'Diary No', 'Receiving No', 'Subject', 'Details'];
      const csvContent = [
        headers.join(','),
        ...res.data.map(log => {
          const date = new Date(log.created_at);
          const detailsStr = log.details ? JSON.stringify(log.details).replace(/"/g, '""') : '';
          return [
            date.toLocaleDateString(),
            date.toLocaleTimeString(),
            `"${log.user_role}"`,
            `"${log.user_name}"`,
            log.action,
            `"${log.diary_number || ''}"`,
            `"${log.receiving_number || ''}"`,
            `"${(log.subject || '').replace(/"/g, '""')}"`,
            `"${detailsStr}"`
          ].join(',');
        })
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `kwsc_activity_log_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      toast.success('Export successful');
    } catch (err) {
      console.error(err);
      toast.error('Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'REGISTER': return <FilePlus className="w-4 h-4 text-emerald-400" />;
      case 'EDIT': return <FileEdit className="w-4 h-4 text-yellow-400" />;
      case 'FORWARD': return <Forward className="w-4 h-4 text-blue-400" />;
      case 'DELETE': return <Trash2 className="w-4 h-4 text-red-400" />;
      case 'LOGIN': return <LogIn className="w-4 h-4 text-purple-400" />;
      case 'LOGOUT': return <LogOut className="w-4 h-4 text-gray-400" />;
      default: return <Activity className="w-4 h-4 text-white/40" />;
    }
  };

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'REGISTER': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'EDIT': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'FORWARD': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'DELETE': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'LOGIN': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'LOGOUT': return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
      default: return 'bg-white/10 text-white border-white/20';
    }
  };

  if (!isAdminUser) {
    return (
      <div className="h-[80vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto" />
          <h2 className="text-2xl font-black text-white">Access Denied</h2>
          <p className="text-white/60">You do not have permission to view the Activity Log.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0f1115]/80 p-6 rounded-[28px] border border-white/5 backdrop-blur-xl shadow-2xl">
        <div className="space-y-1">
          <h1 className="text-2xl font-black flex items-center gap-3 text-white tracking-tighter">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Activity className="w-5 h-5 text-primary" />
            </div>
            System Activity Log
          </h1>
          <p className="text-xs text-white/40 ml-14">
            Track user logins, file registrations, forwards, edits, and deletions across the system.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300"
            onClick={handleExport}
            disabled={isExporting || logs.length === 0}
          >
            {isExporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            Export CSV
          </Button>
          <Button
            variant="outline"
            className="border-white/10 bg-white/5 text-white hover:bg-white/10"
            onClick={loadData}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Column: Stats & Online Users */}
        <div className="space-y-6 lg:col-span-1">
          
          {/* Online Users */}
          <Card className="border-white/10 bg-[#09090b]/50 backdrop-blur-md">
            <CardHeader className="pb-3 border-b border-white/5">
              <CardTitle className="text-sm font-black flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Active Sessions
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {onlineUsers.length > 0 ? (
                <div className="space-y-3">
                  {onlineUsers.map((ou, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 truncate">
                        <User className="w-3.5 h-3.5 text-white/40 shrink-0" />
                        <span className="text-white/80 font-medium truncate" title={ou.user_name}>{ou.user_name}</span>
                      </div>
                      <span className="text-[10px] text-white/40 whitespace-nowrap">
                        {new Date(ou.last_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-white/40 text-center py-2">No active sessions right now.</p>
              )}
            </CardContent>
          </Card>

          {/* User Stats Leaderboard */}
          <Card className="border-white/10 bg-[#09090b]/50 backdrop-blur-md">
            <CardHeader className="pb-3 border-b border-white/5">
              <CardTitle className="text-sm font-black flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                Top Active Users
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 p-0">
              <ScrollArea className="h-[300px]">
                <div className="p-4 space-y-4">
                  {stats.slice(0, 10).map((s, idx) => (
                    <div key={idx} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white truncate pr-2">{s.user_name}</span>
                        <Badge className="bg-white/5 text-white/70 hover:bg-white/10 text-[10px]">
                          {s.total} actions
                        </Badge>
                      </div>
                      <div className="grid grid-cols-4 gap-1">
                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded p-1 flex flex-col items-center" title="Registered">
                          <span className="text-[9px] text-emerald-400 font-bold">{s.registers}</span>
                        </div>
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded p-1 flex flex-col items-center" title="Forwarded">
                          <span className="text-[9px] text-blue-400 font-bold">{s.forwards}</span>
                        </div>
                        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded p-1 flex flex-col items-center" title="Edited">
                          <span className="text-[9px] text-yellow-400 font-bold">{s.edits}</span>
                        </div>
                        <div className="bg-red-500/10 border border-red-500/20 rounded p-1 flex flex-col items-center" title="Deleted">
                          <span className="text-[9px] text-red-400 font-bold">{s.deletes}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {stats.length === 0 && !isLoading && (
                    <p className="text-xs text-white/40 text-center">No user stats available.</p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Activity Table */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* Filters Bar */}
          <div className="flex flex-wrap items-center gap-3 bg-[#09090b]/50 border border-white/5 p-3 rounded-2xl backdrop-blur-sm">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              <Input
                placeholder="Search diary, subject, or user..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(0); }}
                className="pl-9 bg-white/5 border-white/10 text-white h-9 text-xs"
              />
            </div>
            
            <Select value={filterAction} onValueChange={v => { setFilterAction(v); setPage(0); }}>
              <SelectTrigger className="w-[140px] h-9 text-xs bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="All Actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="REGISTER">Register</SelectItem>
                <SelectItem value="FORWARD">Forward</SelectItem>
                <SelectItem value="EDIT">Edit</SelectItem>
                <SelectItem value="DELETE">Delete</SelectItem>
                <SelectItem value="LOGIN">Login</SelectItem>
                <SelectItem value="LOGOUT">Logout</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterUser} onValueChange={v => { setFilterUser(v); setPage(0); }}>
              <SelectTrigger className="w-[160px] h-9 text-xs bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="All Users" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                {stats.map(s => (
                  <SelectItem key={s.user_role} value={s.user_role}>{s.user_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={filterDateFrom}
                onChange={e => { setFilterDateFrom(e.target.value); setPage(0); }}
                className="w-32 h-9 text-xs bg-white/5 border-white/10 text-white"
                title="From Date"
              />
              <span className="text-white/40 text-xs">-</span>
              <Input
                type="date"
                value={filterDateTo}
                onChange={e => { setFilterDateTo(e.target.value); setPage(0); }}
                className="w-32 h-9 text-xs bg-white/5 border-white/10 text-white"
                title="To Date"
              />
            </div>
          </div>

          {/* Table */}
          <Card className="border-white/10 bg-[#09090b]/50 backdrop-blur-md overflow-hidden">
            <CardContent className="p-0">
              {isLoading && logs.length === 0 ? (
                <div className="flex items-center justify-center py-20 text-white/40">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
              ) : logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-white/30">
                  <Activity className="w-12 h-12 mb-4 text-white/10" />
                  <p>No activity logs found matching criteria.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/5 hover:bg-transparent">
                        <TableHead className="text-[10px] text-white/40 font-bold uppercase tracking-wider w-[140px]">Time</TableHead>
                        <TableHead className="text-[10px] text-white/40 font-bold uppercase tracking-wider w-[160px]">User</TableHead>
                        <TableHead className="text-[10px] text-white/40 font-bold uppercase tracking-wider w-[120px]">Action</TableHead>
                        <TableHead className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Record Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.map(log => {
                        const d = new Date(log.created_at);
                        return (
                          <TableRow key={log.id} className="border-white/5 hover:bg-white/[0.02] group">
                            <TableCell className="align-top py-3">
                              <div className="flex flex-col">
                                <span className="text-xs text-white/80 font-mono">
                                  {d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}
                                </span>
                                <span className="text-[10px] text-white/40 font-mono mt-0.5">
                                  {d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="align-top py-3">
                              <div className="flex flex-col">
                                <span className="text-xs font-bold text-white truncate max-w-[140px]" title={log.user_name}>
                                  {log.user_name}
                                </span>
                                <span className="text-[9px] text-white/40 font-mono mt-0.5">
                                  {log.user_role}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="align-top py-3">
                              <Badge className={`text-[10px] uppercase font-bold tracking-wider flex items-center gap-1.5 w-max border ${getActionBadgeColor(log.action)}`}>
                                {getActionIcon(log.action)}
                                {log.action}
                              </Badge>
                            </TableCell>
                            <TableCell className="align-top py-3">
                              {(log.action === 'LOGIN' || log.action === 'LOGOUT') ? (
                                <div className="text-xs text-white/50">
                                  Method: <span className="text-white/80">{log.details?.method || 'unknown'}</span>
                                  {log.details?.email && ` • ${log.details.email}`}
                                </div>
                              ) : (
                                <div className="space-y-1">
                                  {(log.diary_number || log.receiving_number) && (
                                    <div className="flex flex-wrap items-center gap-2">
                                      {log.diary_number && (
                                        <Badge variant="outline" className="text-[10px] font-mono bg-white/5 text-primary border-primary/20">
                                          {log.diary_number}
                                        </Badge>
                                      )}
                                      {log.receiving_number && (
                                        <span className="text-[10px] font-mono text-white/50 bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                                          R.No: {log.receiving_number}
                                        </span>
                                      )}
                                      {log.action === 'FORWARD' && log.details?.mark_to && (
                                        <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
                                          → {log.details.mark_to.toUpperCase()}
                                        </span>
                                      )}
                                      {log.action === 'REGISTER' && log.details?.amount > 0 && (
                                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                          PKR {log.details.amount.toLocaleString()}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                  {log.subject && (
                                    <p className="text-xs text-white/70 font-medium truncate max-w-md" title={log.subject}>
                                      {log.subject}
                                    </p>
                                  )}
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
            
            {/* Pagination footer */}
            {totalRecords > 0 && (
              <div className="border-t border-white/5 p-3 bg-black/20 flex items-center justify-between">
                <div className="text-[10px] text-white/40 font-mono">
                  Showing {page * 50 + 1} - {Math.min((page + 1) * 50, totalRecords)} of {totalRecords} records
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs bg-white/5 border-white/10"
                    disabled={page === 0}
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs bg-white/5 border-white/10"
                    disabled={(page + 1) * 50 >= totalRecords}
                    onClick={() => setPage(p => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </Card>

        </div>
      </div>
    </div>
  );
}
