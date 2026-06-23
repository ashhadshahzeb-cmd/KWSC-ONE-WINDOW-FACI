import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, TrendingUp, DollarSign, Printer, Loader2, List, BarChart3, CheckCircle2, PieChart as PieChartIcon, Activity } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';

const RestrictedDashboard = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [records, setRecords] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Dedicated Print Styles matching exactly the image layout
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @media print {
        @page { size: landscape; margin: 10mm; }
        body * { visibility: hidden !important; background: white !important; color: black !important; }
        #printable-section, #printable-section * { visibility: visible !important; }
        #printable-section {
          position: absolute !important; left: 0 !important; top: 0 !important;
          width: 100% !important; display: block !important;
          background: white !important; color: black !important;
          padding: 5mm !important;
        }
        .kwsc-print-table { width: 100% !important; border-collapse: collapse !important; border: 2px solid black !important; font-family: Arial, sans-serif !important; margin-bottom: 20px !important; }
        .kwsc-print-table th, .kwsc-print-table td { border: 1px solid black !important; padding: 3px 4px !important; font-size: 7.5pt !important; color: black !important; text-align: right !important; vertical-align: middle !important; }
        .kwsc-print-table th { background: white !important; font-weight: bold !important; text-align: center !important; }
        .kwsc-print-table thead tr:first-child th { font-size: 9pt !important; }
        .kwsc-print-table .col-numbers th { font-size: 7pt !important; background: #eaeaea !important; padding: 2px !important; }
        .crosshatch { background: url('data:image/svg+xml;utf8,<svg width="10" height="10" xmlns="http://www.w3.org/2000/svg"><path d="M0,0 L10,10 M10,0 L0,10" stroke="black" stroke-width="0.5"/></svg>') !important; border-left: 2px solid black !important; border-right: 2px solid black !important; width: 12px !important; padding: 0 !important; }
        .print-footer { margin-top: 30px !important; display: flex !important; justify-content: space-between !important; }
        .sig-box { width: 200px !important; border-top: 1px solid black !important; text-align: center !important; padding-top: 5px !important; font-size: 9pt !important; }
      }
      #printable-section { display: none; }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  useEffect(() => {
    if (isAuthenticated) fetchRecords();
  }, [isAuthenticated]);

  const fetchRecords = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('daily_collections').select('*').order('entry_date', { ascending: false });
      if (error) throw error;
      setRecords(data || []);
    } catch (error: any) {
      console.error("Error:", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "kwsc@786") {
      setIsAuthenticated(true);
      toast.success("Welcome back, Cloud Data Ready");
    } else {
      toast.error("Invalid Access Key");
    }
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-PK', { minimumFractionDigits: 2 }).format(val);

  const getMonthlyData = () => {
    const monthlyMap = new Map();
    records.forEach(rec => {
      const month = rec.month || 'Unknown';
      if (!monthlyMap.has(month)) monthlyMap.set(month, { month, wsc: 0, wscc: 0, iacc: 0, wtr: 0, isbc: 0, ccc: 0, asug: 0, cssw: 0 });
      const m = monthlyMap.get(month);
      m.wsc += (rec.wsc || 0); m.wscc += (rec.wscc || 0); m.iacc += (rec.iacc || 0);
      m.wtr += (rec.wtr || 0); m.isbc += (rec.isbc || 0); m.ccc += (rec.ccc || 0);
      m.asug += (rec.asug || 0); m.cssw += (rec.cssw || 0);
    });
    return Array.from(monthlyMap.values());
  };

  const totals = records.reduce((acc, curr) => ({
    wsc: acc.wsc + (curr.wsc || 0), wscc: acc.wscc + (curr.wscc || 0), iacc: acc.iacc + (curr.iacc || 0),
    total_rrg: acc.total_rrg + ((curr.wsc || 0) + (curr.iacc || 0)),
    wtr: acc.wtr + (curr.wtr || 0), isbc: acc.isbc + (curr.isbc || 0), ccc: acc.ccc + (curr.ccc || 0),
    asug: acc.asug + (curr.asug || 0), cssw: acc.cssw + (curr.cssw || 0),
    total_others: acc.total_others + ((curr.wtr || 0) + (curr.isbc || 0) + (curr.ccc || 0) + (curr.asug || 0) + (curr.cssw || 0)),
    grand_total: acc.grand_total + ((curr.wsc || 0) + (curr.iacc || 0) + (curr.wtr || 0) + (curr.isbc || 0) + (curr.ccc || 0) + (curr.asug || 0) + (curr.cssw || 0) + (curr.wscc || 0))
  }), { wsc: 0, wscc: 0, iacc: 0, total_rrg: 0, wtr: 0, isbc: 0, ccc: 0, asug: 0, cssw: 0, total_others: 0, grand_total: 0 });

  if (!isAuthenticated) {
    return (
      <div className="h-[80vh] flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-white/10 bg-[#09090b]/80 backdrop-blur-2xl shadow-2xl overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-sky-500 via-emerald-500 to-sky-500" />
          <CardHeader className="text-center pt-8">
            <div className="mx-auto w-20 h-20 rounded-3xl bg-sky-500/10 flex items-center justify-center mb-6 border border-sky-500/20 shadow-inner">
              <Lock className="w-10 h-10 text-sky-500" />
            </div>
            <CardTitle className="text-3xl font-black tracking-tight text-white uppercase">Finance Restricted</CardTitle>
            <p className="text-muted-foreground text-sm mt-2 font-medium tracking-wide">Enter secure key for cloud synchronization.</p>
          </CardHeader>
          <CardContent className="px-8 pb-10">
            <form onSubmit={handleLogin} className="space-y-6">
              <Input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-white/5 border-white/10 h-12 text-center text-xl tracking-[0.5em] focus:border-sky-500/50 transition-all" />
              <Button type="submit" className="w-full h-12 bg-sky-500 hover:bg-sky-400 text-white font-black text-lg shadow-[0_0_20px_rgba(14,165,233,0.3)]">
                AUTHENTICATE
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-1000 pb-20">
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-2">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-[10px] font-black uppercase tracking-widest">Live Cloud Data</div>
            <div className="flex items-center gap-1.5 text-emerald-500">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Sync Secure</span>
            </div>
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-white">Restricted Dashboard</h1>
          <p className="text-muted-foreground text-sm font-medium italic mt-1">KW&SC Finance Department - Official Daily Statement</p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" className="border-white/10 bg-white/5 hover:bg-white/10 h-11" onClick={fetchRecords} disabled={isLoading}>
            <Loader2 className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
          <Button className="bg-white text-black hover:bg-white/90 h-11 font-bold px-6 shadow-xl" onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-2" />
            Print Report
          </Button>
        </div>
      </div>

      {/* ANALYTICS CHARTS (Replacing Stats Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-white/10 bg-[#09090b]/60 backdrop-blur-xl shadow-2xl">
          <CardHeader className="border-b border-white/5 bg-white/[0.02] p-4">
            <CardTitle className="text-xs font-black tracking-[0.2em] uppercase flex items-center gap-2 text-indigo-400">
              <BarChart3 className="w-4 h-4" /> Monthly Collection Comparison
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={getMonthlyData()} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="month" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `Rs.${(value / 1000000).toFixed(1)}M`} />
                <Tooltip
                  cursor={{ fill: '#ffffff05' }}
                  contentStyle={{ backgroundColor: '#09090b', borderColor: '#ffffff20', borderRadius: '8px' }}
                  formatter={(value: number) => [`Rs. ${formatCurrency(value)}`, '']}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                <Bar dataKey="wsc" name="W&S" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                <Bar dataKey="iacc" name="Arrears" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="wtr" name="Tanker" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-[#09090b]/60 backdrop-blur-xl shadow-2xl">
          <CardHeader className="border-b border-white/5 bg-white/[0.02] p-4">
            <CardTitle className="text-xs font-black tracking-[0.2em] uppercase flex items-center gap-2 text-emerald-400">
              <Activity className="w-4 h-4" /> Daily Trend (W&S Collection)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={[...records].reverse()} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorWsc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis dataKey="entry_date" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} minTickGap={30} />
                <YAxis stroke="#888888" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `Rs.${(value / 1000000).toFixed(1)}M`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#09090b', borderColor: '#ffffff20', borderRadius: '8px' }}
                  labelStyle={{ color: '#888' }}
                  formatter={(value: number) => [`Rs. ${formatCurrency(value)}`, 'W&S Collection']}
                />
                <Area type="monotone" dataKey="wsc" stroke="#0ea5e9" strokeWidth={2} fillOpacity={1} fill="url(#colorWsc)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* MAIN CONTENT AREA */}
      <Tabs defaultValue="daily" className="w-full">
        <div className="flex items-center justify-between mb-6 px-2">
          <TabsList className="bg-[#09090b] border border-white/10 p-1 h-12 shadow-2xl">
            <TabsTrigger value="daily" className="data-[state=active]:bg-sky-500 data-[state=active]:text-white px-8 font-black text-xs uppercase tracking-widest transition-all">Daily Records</TabsTrigger>
            <TabsTrigger value="monthly" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white px-8 font-black text-xs uppercase tracking-widest transition-all">Monthly Summary</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="daily" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="border-white/10 bg-[#09090b]/40 backdrop-blur-xl overflow-hidden shadow-2xl">
            <div className="bg-white/[0.03] border-b border-white/5 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <List className="w-4 h-4 text-sky-500" />
                <h2 className="text-[10px] font-black tracking-[0.3em] uppercase text-sky-500">Daily Recorded Statement</h2>
              </div>
            </div>
            <CardContent className="p-0 overflow-x-auto">
              <CollectionTable records={records} formatCurrency={formatCurrency} totals={totals} showDate={true} theme="sky" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monthly" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="border-white/10 bg-[#09090b]/40 backdrop-blur-xl overflow-hidden shadow-2xl">
            <div className="bg-white/[0.03] border-b border-white/5 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BarChart3 className="w-4 h-4 text-emerald-500" />
                <h2 className="text-[10px] font-black tracking-[0.3em] uppercase text-emerald-500">Monthly Aggregated Summary</h2>
              </div>
            </div>
            <CardContent className="p-0 overflow-x-auto">
              <CollectionTable records={getMonthlyData()} formatCurrency={formatCurrency} totals={totals} showDate={false} theme="emerald" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* PRINT SECTION (HIDDEN ON SCREEN) */}
      <div id="printable-section">
        <div style={{textAlign: 'center', textDecoration: 'underline', marginBottom: '10px', fontSize: '11pt', fontWeight: 'bold'}}>
          DAILY COLLECTION STATEMENT W.E.F. {records.length > 0 ? records[records.length-1].entry_date : ''} TO {records.length > 0 ? records[0].entry_date : ''}
        </div>
        
        <table className="kwsc-print-table">
          <thead>
            <tr>
              <th rowSpan={2} style={{width: '6%'}}>MONTH &<br/>YEAR</th>
              <th colSpan={4}>COLLECTION UNDER RRG</th>
              <th rowSpan={3} className="crosshatch"></th>
              <th colSpan={6}>KW&SC OTHER COLLECTIONS</th>
              <th rowSpan={2} style={{width: '8%'}}>Total KW&SC<br/>Collection<br/>( 05+11 )</th>
            </tr>
            <tr>
              <th>WATER &<br/>SEWERAGE<br/>COLLECTION</th>
              <th style={{fontSize: '6pt'}}>WATER &<br/>SEWERAGE<br/>CONNECTION<br/>CHARGES<br/><span style={{fontSize: '4pt'}}>(ABL CIVIC CENTRE BR.)</span></th>
              <th>INDUSTRIES<br/>ARREAR<br/>COLLECTION<br/>CHARGES</th>
              <th>TOTAL<br/>( 02+04 )</th>
              <th style={{fontSize: '6pt'}}>WATER TANKER<br/>RECEIPTS</th>
              <th style={{fontSize: '6pt'}}>INFRA STRUCTURE<br/>BETTERMENT<br/>CHARGES ( SINDH<br/>BANK )</th>
              <th style={{fontSize: '6pt'}}>COLLECTION OF<br/>COMMERCIALIZATIO<br/>N CHARGES<br/><span style={{fontSize: '4pt'}}>(ABL CIVIC CENTRE BR.)</span></th>
              <th style={{fontSize: '6pt'}}>AUCTION OF SCRAP<br/>UNSERVICEABLE<br/>GOODS <span style={{fontSize: '4pt'}}>(NBP<br/>GULSHAN-E-IQBAL BR.)</span></th>
              <th>COLLECTION<br/>OF SUB SOIL<br/>WATER</th>
              <th>TOTAL OTHERS<br/>( 06 TO 10 )</th>
            </tr>
            <tr className="col-numbers">
              <th>01</th>
              <th>02</th>
              <th>03</th>
              <th>04</th>
              <th>05</th>
              <th>06</th>
              <th>07</th>
              <th>08</th>
              <th>09</th>
              <th>10</th>
              <th>11</th>
              <th>12</th>
            </tr>
          </thead>
          <tbody>
            {getMonthlyData().map((row: any, i: number) => (
              <tr key={i}>
                <td style={{textAlign: 'left', fontWeight: 'bold'}}>{row.month.toUpperCase()}</td>
                <td>{formatCurrency(row.wsc)}</td>
                <td>{formatCurrency(row.wscc)}</td>
                <td>{formatCurrency(row.iacc)}</td>
                <td style={{fontWeight: 'bold'}}>{formatCurrency((row.wsc||0)+(row.wscc||0)+(row.iacc||0))}</td>
                <td>{formatCurrency(row.wtr)}</td>
                <td>{formatCurrency(row.isbc)}</td>
                <td>{formatCurrency(row.ccc)}</td>
                <td>{formatCurrency(row.asug)}</td>
                <td>{formatCurrency(row.cssw)}</td>
                <td style={{fontWeight: 'bold'}}>{formatCurrency((row.wtr||0)+(row.isbc||0)+(row.ccc||0)+(row.asug||0)+(row.cssw||0))}</td>
                <td style={{fontWeight: 'bold'}}>{formatCurrency((row.wsc||0)+(row.wscc||0)+(row.iacc||0)+(row.wtr||0)+(row.isbc||0)+(row.ccc||0)+(row.asug||0)+(row.cssw||0))}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{fontWeight: 'bold'}}>
              <td style={{textAlign: 'center'}}>TOTAL</td>
              <td>{formatCurrency(totals.wsc)}</td>
              <td>{formatCurrency(totals.wscc)}</td>
              <td>{formatCurrency(totals.iacc)}</td>
              <td>{formatCurrency(totals.total_rrg + totals.wscc)}</td>
              <td>{formatCurrency(totals.wtr)}</td>
              <td>{formatCurrency(totals.isbc)}</td>
              <td>{formatCurrency(totals.ccc)}</td>
              <td>{formatCurrency(totals.asug)}</td>
              <td>{formatCurrency(totals.cssw)}</td>
              <td>{formatCurrency(totals.total_others)}</td>
              <td>{formatCurrency(totals.grand_total)}</td>
            </tr>
          </tfoot>
        </table>

        <div style={{textAlign: 'left', textDecoration: 'underline', marginTop: '20px', marginBottom: '10px', fontSize: '11pt', fontWeight: 'bold', paddingLeft: '40px'}}>
          COLLECTION AS ON &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; {records.length > 0 ? records[0].entry_date : ''}
        </div>
        
        <table className="kwsc-print-table">
          <thead>
            <tr>
              <th rowSpan={2} style={{width: '6%'}}>DATE</th>
              <th colSpan={4}>COLLECTION UNDER RRG</th>
              <th rowSpan={3} className="crosshatch"></th>
              <th colSpan={6}>KW&SC OTHER COLLECTIONS</th>
              <th rowSpan={2} style={{width: '8%'}}>Total KW&SC<br/>Collection<br/>( 05+11 )</th>
            </tr>
            <tr>
              <th>WATER &<br/>SEWERAGE<br/>COLLECTION</th>
              <th style={{fontSize: '6pt'}}>WATER &<br/>SEWERAGE<br/>CONNECTION<br/>CHARGES<br/><span style={{fontSize: '4pt'}}>(ABL CIVIC CENTRE BR.)</span></th>
              <th>INDUSTRIES<br/>ARREAR<br/>COLLECTION<br/>CHARGES</th>
              <th>TOTAL<br/>( 02+04 )</th>
              <th style={{fontSize: '6pt'}}>WATER TANKER<br/>RECEIPTS</th>
              <th style={{fontSize: '6pt'}}>INFRA STRUCTURE<br/>BETTERMENT<br/>CHARGES ( SINDH<br/>BANK )</th>
              <th style={{fontSize: '6pt'}}>COLLECTION OF<br/>COMMERCIALIZATIO<br/>N CHARGES<br/><span style={{fontSize: '4pt'}}>(ABL CIVIC CENTRE BR.)</span></th>
              <th style={{fontSize: '6pt'}}>AUCTION OF SCRAP<br/>UNSERVICEABLE<br/>GOODS <span style={{fontSize: '4pt'}}>(NBP<br/>GULSHAN-E-IQBAL BR.)</span></th>
              <th>COLLECTION<br/>OF SUB SOIL<br/>WATER</th>
              <th>TOTAL OTHERS<br/>( 06 TO 10 )</th>
            </tr>
            <tr className="col-numbers">
              <th>01</th>
              <th>02</th>
              <th>03</th>
              <th>04</th>
              <th>05</th>
              <th>06</th>
              <th>07</th>
              <th>08</th>
              <th>09</th>
              <th>10</th>
              <th>11</th>
              <th>12</th>
            </tr>
          </thead>
          <tbody>
            {records.length > 0 && (
              <tr>
                <td style={{textAlign: 'center', fontWeight: 'bold'}}>{records[0].entry_date}</td>
                <td>{formatCurrency(records[0].wsc)}</td>
                <td>{formatCurrency(records[0].wscc)}</td>
                <td>{formatCurrency(records[0].iacc)}</td>
                <td style={{fontWeight: 'bold'}}>{formatCurrency((records[0].wsc||0)+(records[0].wscc||0)+(records[0].iacc||0))}</td>
                <td>{formatCurrency(records[0].wtr)}</td>
                <td>{formatCurrency(records[0].isbc)}</td>
                <td>{formatCurrency(records[0].ccc)}</td>
                <td>{formatCurrency(records[0].asug)}</td>
                <td>{formatCurrency(records[0].cssw)}</td>
                <td style={{fontWeight: 'bold'}}>{formatCurrency((records[0].wtr||0)+(records[0].isbc||0)+(records[0].ccc||0)+(records[0].asug||0)+(records[0].cssw||0))}</td>
                <td style={{fontWeight: 'bold'}}>{formatCurrency((records[0].wsc||0)+(records[0].wscc||0)+(records[0].iacc||0)+(records[0].wtr||0)+(records[0].isbc||0)+(records[0].ccc||0)+(records[0].asug||0)+(records[0].cssw||0))}</td>
              </tr>
            )}
          </tbody>
          <tfoot>
            {records.length > 0 && (
              <tr style={{fontWeight: 'bold'}}>
                <td style={{textAlign: 'center'}}>TOTAL</td>
                <td>{formatCurrency(records[0].wsc)}</td>
                <td>{formatCurrency(records[0].wscc)}</td>
                <td>{formatCurrency(records[0].iacc)}</td>
                <td>{formatCurrency((records[0].wsc||0)+(records[0].wscc||0)+(records[0].iacc||0))}</td>
                <td>{formatCurrency(records[0].wtr)}</td>
                <td>{formatCurrency(records[0].isbc)}</td>
                <td>{formatCurrency(records[0].ccc)}</td>
                <td>{formatCurrency(records[0].asug)}</td>
                <td>{formatCurrency(records[0].cssw)}</td>
                <td>{formatCurrency((records[0].wtr||0)+(records[0].isbc||0)+(records[0].ccc||0)+(records[0].asug||0)+(records[0].cssw||0))}</td>
                <td>{formatCurrency((records[0].wsc||0)+(records[0].wscc||0)+(records[0].iacc||0)+(records[0].wtr||0)+(records[0].isbc||0)+(records[0].ccc||0)+(records[0].asug||0)+(records[0].cssw||0))}</td>
              </tr>
            )}
          </tfoot>
        </table>
        
        <div style={{fontSize: '9pt', marginTop: '5px', fontWeight: 'bold', display: 'flex', alignItems: 'center'}}>
          <span style={{fontSize: '12pt', marginRight: '5px'}}>☆</span> <span><span style={{textDecoration: 'underline'}}>Note:</span> Report prepared on the basis of Telephonic Bank balances.</span>
        </div>
      </div>
    </div>
  );
};

const CollectionTable = ({ records, formatCurrency, totals, showDate, theme }: any) => {
  const accentColor = theme === 'sky' ? 'text-sky-500' : 'text-emerald-500';
  const accentBg = theme === 'sky' ? 'bg-sky-500/5' : 'bg-emerald-500/5';
  const headerBg = theme === 'sky' ? 'bg-sky-500/10' : 'bg-emerald-500/10';

  return (
    <table className="w-full border-collapse text-[10px]">
      <thead>
        <tr className="border-b border-white/10 bg-white/[0.02]">
          {showDate && <th className="p-4 font-black uppercase text-center border-r border-white/5 text-muted-foreground">Date</th>}
          <th className="p-4 font-black uppercase text-center border-r border-white/5 text-muted-foreground">Month</th>
          <th colSpan={4} className={`p-2 border-r border-white/5 font-black uppercase text-center ${headerBg} ${accentColor} border-b border-white/10`}>RRG Collection</th>
          <th colSpan={6} className="p-2 border-r border-white/5 font-black uppercase text-center bg-white/5 text-white border-b border-white/10">KW&SC Other Receipts</th>
          <th className="p-4 font-black uppercase text-center bg-white/10 text-white border-b border-white/10">Grand Total</th>
        </tr>
        <tr className="border-b border-white/5 bg-black/20 text-[8px] text-muted-foreground font-bold">
          {showDate && <th className="border-r border-white/5" />}
          <th className="border-r border-white/5" />
          <th className="p-2 border-r border-white/5 uppercase">W&S</th>
          <th className="p-2 border-r border-white/5 uppercase">Conn</th>
          <th className="p-2 border-r border-white/5 uppercase">Arrear</th>
          <th className={`p-2 border-r border-white/5 uppercase ${accentBg} ${accentColor}`}>Sub Total</th>
          <th className="p-2 border-r border-white/5 uppercase">Tanker</th>
          <th className="p-2 border-r border-white/5 uppercase">Infra</th>
          <th className="p-2 border-r border-white/5 uppercase">Comm</th>
          <th className="p-2 border-r border-white/5 uppercase">Scrap</th>
          <th className="p-2 border-r border-white/5 uppercase">Soil</th>
          <th className="p-2 border-r border-white/5 uppercase bg-white/5">Sub Total</th>
          <th className="p-2 bg-white/10" />
        </tr>
      </thead>
      <tbody className="text-white/80">
        {records.map((row: any, idx: number) => (
          <tr key={idx} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors font-mono">
            {showDate && <td className="p-3 text-center border-r border-white/5 text-muted-foreground">{row.entry_date}</td>}
            <td className="p-3 text-center border-r border-white/5 font-black text-white">{row.month}</td>
            <td className="p-3 text-right border-r border-white/5">{formatCurrency(row.wsc)}</td>
            <td className="p-3 text-right border-r border-white/5">{formatCurrency(row.wscc)}</td>
            <td className="p-3 text-right border-r border-white/5">{formatCurrency(row.iacc)}</td>
            <td className={`p-3 text-right border-r border-white/5 font-black ${accentBg} ${accentColor}`}>{formatCurrency((row.wsc || 0) + (row.iacc || 0))}</td>
            <td className="p-3 text-right border-r border-white/5">{formatCurrency(row.wtr)}</td>
            <td className="p-3 text-right border-r border-white/5">{formatCurrency(row.isbc)}</td>
            <td className="p-3 text-right border-r border-white/5">{formatCurrency(row.ccc)}</td>
            <td className="p-3 text-right border-r border-white/5">{formatCurrency(row.asug)}</td>
            <td className="p-3 text-right border-r border-white/5">{formatCurrency(row.cssw)}</td>
            <td className="p-3 text-right border-r border-white/5 font-black bg-white/5 text-white">{formatCurrency((row.wtr || 0) + (row.isbc || 0) + (row.ccc || 0) + (row.asug || 0) + (row.cssw || 0))}</td>
            <td className="p-3 text-right font-black bg-white/10 text-white">{formatCurrency((row.wsc || 0) + (row.iacc || 0) + (row.wtr || 0) + (row.isbc || 0) + (row.ccc || 0) + (row.asug || 0) + (row.cssw || 0) + (row.wscc || 0))}</td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr className="bg-black/40 font-black border-t-2 border-white/10">
          <td colSpan={showDate ? 2 : 1} className="p-4 text-center text-xs uppercase tracking-widest text-muted-foreground border-r border-white/5">Totals</td>
          <td className="p-3 text-right border-r border-white/5">{formatCurrency(totals.wsc)}</td>
          <td className="p-3 text-right border-r border-white/5">{formatCurrency(totals.wscc)}</td>
          <td className="p-3 text-right border-r border-white/5">{formatCurrency(totals.iacc)}</td>
          <td className={`p-3 text-right border-r border-white/5 ${accentBg} ${accentColor}`}>{formatCurrency(totals.total_rrg)}</td>
          <td className="p-3 text-right border-r border-white/5">{formatCurrency(totals.wtr)}</td>
          <td className="p-3 text-right border-r border-white/5">{formatCurrency(totals.isbc)}</td>
          <td className="p-3 text-right border-r border-white/5">{formatCurrency(totals.ccc)}</td>
          <td className="p-3 text-right border-r border-white/5">{formatCurrency(totals.asug)}</td>
          <td className="p-3 text-right border-r border-white/5">{formatCurrency(totals.cssw)}</td>
          <td className="p-3 text-right border-r border-white/5 bg-white/5 text-white">{formatCurrency(totals.total_others)}</td>
          <td className="p-4 text-right bg-sky-500 text-white text-xs">{formatCurrency(totals.grand_total)}</td>
        </tr>
      </tfoot>
    </table>
  );
};

export default RestrictedDashboard;
