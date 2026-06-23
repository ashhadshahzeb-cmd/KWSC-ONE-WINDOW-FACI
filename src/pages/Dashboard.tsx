import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Clock,
  Landmark,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  BarChart3,
  List,
  Sparkles
} from "lucide-react";
import { bankAccounts, transactions, monthlyData, formatCurrency } from "@/lib/mock-data";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

const totalBalance = bankAccounts.reduce((s, b) => s + (b.currency === 'PKR' ? b.balance : b.balance * 280), 0);
const totalIncome = 2775000;
const totalExpenses = 1450800;
const pendingCount = transactions.filter(t => t.status === 'pending').length;

export default function Dashboard() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="relative min-h-screen w-full pb-20">
      {/* ANIMATED AMBIENT BACKGROUND */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none opacity-40">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-emerald-500/20 blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] rounded-full bg-sky-500/20 blur-[120px] animate-pulse" style={{ animationDuration: '12s', animationDelay: '1s' }} />
        <div className="absolute -bottom-[20%] left-[20%] w-[60%] h-[60%] rounded-full bg-indigo-500/20 blur-[120px] animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />
      </div>

      {/* FOREGROUND CONTENT */}
      <div className={cn("relative z-10 space-y-6 transition-all duration-1000", mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8")}>
        
        {/* HEADER */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 px-2 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-[10px] font-medium uppercase tracking-widest text-emerald-400">Live Workspace</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-light tracking-tight text-white mb-2">
              Financial <span className="font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-emerald-400">Overview</span>
            </h1>
            <p className="text-white/50 text-sm font-light">Real-time metrics and dynamic tracking.</p>
          </div>
          <div className="flex items-center gap-3 bg-white/5 backdrop-blur-3xl border border-white/10 px-4 py-2 rounded-2xl shadow-xl">
            <Sparkles className="w-4 h-4 text-sky-400" />
            <span className="text-xs font-medium text-white/80">Updated just now</span>
          </div>
        </div>

        {/* BENTO GRID */}
        <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-4 lg:gap-6 auto-rows-max">
          
          {/* STAT 1: Balance */}
          <div className="col-span-1 md:col-span-3 lg:col-span-3 bg-white/[0.02] border border-white/5 rounded-3xl p-6 backdrop-blur-3xl hover:bg-white/[0.04] transition-all group overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-sky-500/20 transition-all"></div>
            <div className="flex justify-between items-start mb-6">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-500/20 to-transparent flex items-center justify-center border border-sky-500/20">
                <Wallet className="w-4 h-4 text-sky-400" />
              </div>
              <span className="text-[10px] font-semibold text-white/40 uppercase tracking-widest">Total Balance</span>
            </div>
            <p className="text-3xl font-bold tracking-tighter text-white mb-1">{formatCurrency(totalBalance)}</p>
            <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
              <ArrowUpRight className="w-3.5 h-3.5" /> +8.2% <span className="text-white/30 ml-1 font-light">vs last month</span>
            </div>
          </div>

          {/* STAT 2: Income */}
          <div className="col-span-1 md:col-span-3 lg:col-span-3 bg-white/[0.02] border border-white/5 rounded-3xl p-6 backdrop-blur-3xl hover:bg-white/[0.04] transition-all group overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-emerald-500/20 transition-all"></div>
            <div className="flex justify-between items-start mb-6">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-transparent flex items-center justify-center border border-emerald-500/20">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="text-[10px] font-semibold text-white/40 uppercase tracking-widest">Income</span>
            </div>
            <p className="text-3xl font-bold tracking-tighter text-white mb-1">{formatCurrency(totalIncome)}</p>
            <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
              <ArrowUpRight className="w-3.5 h-3.5" /> +12.4% <span className="text-white/30 ml-1 font-light">vs last month</span>
            </div>
          </div>

          {/* STAT 3: Expenses */}
          <div className="col-span-1 md:col-span-3 lg:col-span-3 bg-white/[0.02] border border-white/5 rounded-3xl p-6 backdrop-blur-3xl hover:bg-white/[0.04] transition-all group overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-rose-500/20 transition-all"></div>
            <div className="flex justify-between items-start mb-6">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-500/20 to-transparent flex items-center justify-center border border-rose-500/20">
                <TrendingDown className="w-4 h-4 text-rose-400" />
              </div>
              <span className="text-[10px] font-semibold text-white/40 uppercase tracking-widest">Expenses</span>
            </div>
            <p className="text-3xl font-bold tracking-tighter text-white mb-1">{formatCurrency(totalExpenses)}</p>
            <div className="flex items-center gap-1.5 text-xs font-medium text-rose-400">
              <ArrowDownRight className="w-3.5 h-3.5" /> -3.1% <span className="text-white/30 ml-1 font-light">vs last month</span>
            </div>
          </div>

          {/* STAT 4: Approvals */}
          <div className="col-span-1 md:col-span-3 lg:col-span-3 bg-white/[0.02] border border-white/5 rounded-3xl p-6 backdrop-blur-3xl hover:bg-white/[0.04] transition-all group overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-amber-500/20 transition-all"></div>
            <div className="flex justify-between items-start mb-6">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500/20 to-transparent flex items-center justify-center border border-amber-500/20">
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <span className="text-[10px] font-semibold text-white/40 uppercase tracking-widest">Pending</span>
            </div>
            <p className="text-3xl font-bold tracking-tighter text-white mb-1">{pendingCount}</p>
            <div className="flex items-center gap-1.5 text-xs font-medium text-amber-400">
              <Activity className="w-3.5 h-3.5" /> Awaiting <span className="text-white/30 ml-1 font-light">clearance</span>
            </div>
          </div>

          {/* MAIN CHART - INCOME VS EXPENSES */}
          <div className="col-span-1 md:col-span-6 lg:col-span-8 bg-white/[0.02] border border-white/5 rounded-3xl p-6 backdrop-blur-3xl flex flex-col min-h-[400px]">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-lg font-bold text-white mb-1">Cash Flow Analytics</h3>
                <p className="text-xs text-white/40 font-light">Income vs Expenses over the year</p>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-400"></div><span className="text-[10px] text-white/60 font-medium">Income</span></div>
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-rose-400"></div><span className="text-[10px] text-white/60 font-medium">Expenses</span></div>
              </div>
            </div>
            <div className="flex-1 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} barGap={6} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis dataKey="month" stroke="#ffffff30" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="#ffffff30" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
                  <Tooltip
                    cursor={{ fill: '#ffffff03' }}
                    contentStyle={{ backgroundColor: 'rgba(9, 9, 11, 0.8)', backdropFilter: 'blur(10px)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '16px', padding: '12px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}
                    itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                    labelStyle={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}
                    formatter={(v: number) => [`Rs. ${formatCurrency(v)}`, '']}
                  />
                  <Bar dataKey="income" fill="#34d399" radius={[4, 4, 0, 0]} maxBarSize={32} />
                  <Bar dataKey="expenses" fill="#fb7185" radius={[4, 4, 0, 0]} maxBarSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* RIGHT COLUMN - BANKS */}
          <div className="col-span-1 md:col-span-6 lg:col-span-4 bg-white/[0.02] border border-white/5 rounded-3xl p-6 backdrop-blur-3xl flex flex-col min-h-[400px]">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-white mb-1">Accounts</h3>
                <p className="text-xs text-white/40 font-light">Active bank balances</p>
              </div>
              <Landmark className="w-4 h-4 text-white/20" />
            </div>
            <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-2">
              {bankAccounts.map((bank) => (
                <div key={bank.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.05] hover:border-white/[0.1] transition-all cursor-default group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 border border-white/10 overflow-hidden relative">
                      <div className="absolute inset-0 opacity-20" style={{ backgroundColor: bank.color }}></div>
                      <span className="font-bold text-xs relative z-10" style={{ color: bank.color }}>{bank.bankName.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white/90 group-hover:text-white transition-colors">{bank.bankName}</p>
                      <p className="text-[10px] font-mono text-white/40 mt-0.5">{bank.maskedNumber}</p>
                    </div>
                  </div>
                  <p className="text-sm font-bold font-mono text-white tracking-tight">
                    {formatCurrency(bank.balance, bank.currency)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* TRANSACTIONS TABLE */}
          <div className="col-span-1 md:col-span-6 lg:col-span-8 bg-white/[0.02] border border-white/5 rounded-3xl p-6 backdrop-blur-3xl flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-white mb-1">Recent Activity</h3>
                <p className="text-xs text-white/40 font-light">Latest financial transactions</p>
              </div>
              <List className="w-4 h-4 text-white/20" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left pb-4 font-medium text-[10px] uppercase tracking-widest text-white/30">Date</th>
                    <th className="text-left pb-4 font-medium text-[10px] uppercase tracking-widest text-white/30">Transaction</th>
                    <th className="text-right pb-4 font-medium text-[10px] uppercase tracking-widest text-white/30">Amount</th>
                    <th className="text-center pb-4 font-medium text-[10px] uppercase tracking-widest text-white/30">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {transactions.slice(0, 5).map((t) => (
                    <tr key={t.id} className="group hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 pr-4 font-mono text-xs text-white/50 whitespace-nowrap">{t.date}</td>
                      <td className="py-4 pr-4">
                        <div className="flex items-center gap-3">
                          <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0 border", 
                            t.type === 'credit' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20")}>
                            {t.type === 'credit' ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                          </div>
                          <div>
                            <p className="font-semibold text-white/90 text-xs">{t.description}</p>
                            <p className="text-[10px] text-white/40 mt-0.5">{t.bankName}</p>
                          </div>
                        </div>
                      </td>
                      <td className={cn("py-4 pr-4 text-right font-mono font-bold tracking-tight", t.type === 'credit' ? "text-emerald-400" : "text-rose-400")}>
                        {t.type === 'credit' ? '+' : '-'}{formatCurrency(t.amount)}
                      </td>
                      <td className="py-4 text-center">
                        <span className={cn(
                          "text-[9px] px-2.5 py-1 rounded-full font-bold uppercase tracking-widest border",
                          t.status === 'reconciled' && "bg-sky-500/10 text-sky-400 border-sky-500/20",
                          t.status === 'approved' && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                          t.status === 'pending' && "bg-amber-500/10 text-amber-400 border-amber-500/20",
                        )}>
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* NET CASH FLOW AREA CHART */}
          <div className="col-span-1 md:col-span-6 lg:col-span-4 bg-white/[0.02] border border-white/5 rounded-3xl p-6 backdrop-blur-3xl flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-white mb-1">Net Flow</h3>
                <p className="text-xs text-white/40 font-light">Monthly net position</p>
              </div>
              <BarChart3 className="w-4 h-4 text-white/20" />
            </div>
            <div className="flex-1 w-full min-h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData.map(m => ({ ...m, net: m.income - m.expenses }))} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorNetBento" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" stroke="#ffffff30" fontSize={9} tickLine={false} axisLine={false} dy={5} />
                  <YAxis stroke="#ffffff30" fontSize={9} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(9, 9, 11, 0.8)', backdropFilter: 'blur(10px)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }} 
                    itemStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                    labelStyle={{ fontSize: '9px', color: 'rgba(255,255,255,0.5)', marginBottom: '2px' }}
                    formatter={(v: number) => [`Rs. ${formatCurrency(v)}`, 'Net']} 
                  />
                  <Area type="monotone" dataKey="net" stroke="#38bdf8" strokeWidth={2} fillOpacity={1} fill="url(#colorNetBento)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
