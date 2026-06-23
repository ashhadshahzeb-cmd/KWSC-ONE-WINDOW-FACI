import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, AlertCircle, PieChart as PieIcon, BarChart3, TrendingUp, FolderOpen } from 'lucide-react';
import { 
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area, Legend
} from 'recharts';

const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#14b8a6', '#f97316'];

export default function FileAnalytics() {
  const { userRole, isAdmin } = useAuth();
  const isAdminUser = userRole === 'admin' || isAdmin;
  
  const [isLoading, setIsLoading] = useState(true);
  const [records, setRecords] = useState<any[]>([]);

  useEffect(() => {
    if (isAdminUser) {
      fetchData();
    }
  }, [isAdminUser]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('file_tracking_records' as any)
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setRecords(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAdminUser) {
    return (
      <div className="h-[80vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto" />
          <h2 className="text-2xl font-black text-white">Access Denied</h2>
          <p className="text-white/60">You do not have permission to view File Analytics.</p>
        </div>
      </div>
    );
  }

  // --- DATA PROCESSING ---
  
  // 1. Category Distribution
  const categoryCount = records.reduce((acc, curr) => {
    const cat = curr.main_category || 'Uncategorized';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const categoryData = Object.keys(categoryCount).map(key => ({
    name: key.toUpperCase(),
    value: categoryCount[key]
  })).sort((a, b) => b.value - a.value);

  // 2. Workload by Section (mark_to)
  const workloadCount = records.reduce((acc, curr) => {
    const section = curr.mark_to || 'Unknown';
    acc[section] = (acc[section] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const workloadData = Object.keys(workloadCount).map(key => ({
    name: key.toUpperCase(),
    files: workloadCount[key]
  })).sort((a, b) => b.files - a.files);

  // 3. Daily Trend (last 30 days roughly, or just aggregate by date)
  const trendCount = records.reduce((acc, curr) => {
    const date = new Date(curr.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const trendData = Object.keys(trendCount).map(date => ({
    date,
    files: trendCount[date]
  }));

  if (isLoading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-sky-500 animate-spin mb-4" />
        <p className="text-white/50 animate-pulse">Analyzing File Records...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-16">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0f1115]/80 p-6 rounded-[28px] border border-white/5 backdrop-blur-xl shadow-2xl">
        <div className="space-y-1">
          <h1 className="text-2xl font-black flex items-center gap-3 text-white tracking-tighter">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-sky-400" />
            </div>
            File Flow Analytics
          </h1>
          <p className="text-xs text-white/40 ml-14">
            Visual insights into department workload, category distributions, and daily registration trends.
          </p>
        </div>
        <div className="flex gap-4">
          <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl flex flex-col items-center">
            <span className="text-[10px] uppercase text-white/40 font-bold tracking-widest">Total Files</span>
            <span className="text-xl font-black text-white">{records.length}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* CATEGORY PIE CHART */}
        <Card className="border-white/10 bg-[#09090b]/50 backdrop-blur-md">
          <CardHeader className="pb-2 border-b border-white/5">
            <CardTitle className="text-sm font-black flex items-center gap-2 text-white">
              <PieIcon className="w-4 h-4 text-emerald-400" />
              File Distribution by Category
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[350px] pt-6">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: 'rgba(9, 9, 11, 0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    iconType="circle"
                    wrapperStyle={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-white/30 text-sm">No data available</div>
            )}
          </CardContent>
        </Card>

        {/* WORKLOAD BAR CHART */}
        <Card className="border-white/10 bg-[#09090b]/50 backdrop-blur-md">
          <CardHeader className="pb-2 border-b border-white/5">
            <CardTitle className="text-sm font-black flex items-center gap-2 text-white">
              <BarChart3 className="w-4 h-4 text-amber-400" />
              Current Workload by Section
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[350px] pt-6">
            {workloadData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={workloadData} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#ffffff10" />
                  <XAxis type="number" stroke="#ffffff40" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis dataKey="name" type="category" stroke="#ffffff70" fontSize={10} tickLine={false} axisLine={false} width={80} />
                  <RechartsTooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    contentStyle={{ backgroundColor: 'rgba(9, 9, 11, 0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    itemStyle={{ color: '#fbbf24', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="files" fill="#fbbf24" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-white/30 text-sm">No data available</div>
            )}
          </CardContent>
        </Card>

        {/* DAILY TREND AREA CHART */}
        <Card className="col-span-1 lg:col-span-2 border-white/10 bg-[#09090b]/50 backdrop-blur-md">
          <CardHeader className="pb-2 border-b border-white/5">
            <CardTitle className="text-sm font-black flex items-center gap-2 text-white">
              <TrendingUp className="w-4 h-4 text-sky-400" />
              Daily File Registration Trend
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] pt-6">
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorFiles" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis dataKey="date" stroke="#ffffff40" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="#ffffff40" fontSize={10} tickLine={false} axisLine={false} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: 'rgba(9, 9, 11, 0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    itemStyle={{ color: '#0ea5e9', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="files" name="Files Registered" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorFiles)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-white/30 text-sm">No data available</div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
