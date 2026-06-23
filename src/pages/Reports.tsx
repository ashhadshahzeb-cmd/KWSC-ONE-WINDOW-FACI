import { chartOfAccounts, formatCurrency, monthlyData } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { FileText, Download } from "lucide-react";
import { useState } from "react";

type ReportType = 'trial-balance' | 'pnl' | 'balance-sheet' | 'cash-flow';

export default function Reports() {
  const [activeReport, setActiveReport] = useState<ReportType>('trial-balance');

  const reports: { id: ReportType; label: string }[] = [
    { id: 'trial-balance', label: 'Trial Balance' },
    { id: 'pnl', label: 'Profit & Loss' },
    { id: 'balance-sheet', label: 'Balance Sheet' },
    { id: 'cash-flow', label: 'Cash Flow' },
  ];

  const assets = chartOfAccounts.filter(a => a.type === 'asset');
  const liabilities = chartOfAccounts.filter(a => a.type === 'liability');
  const equity = chartOfAccounts.filter(a => a.type === 'equity');
  const income = chartOfAccounts.filter(a => a.type === 'income');
  const expenses = chartOfAccounts.filter(a => a.type === 'expense');

  const totalIncome = income.reduce((s, a) => s + a.balance, 0);
  const totalExpenses = expenses.reduce((s, a) => s + a.balance, 0);
  const netProfit = totalIncome - totalExpenses;

  const totalAssets = assets.reduce((s, a) => s + (a.parentCode ? a.balance : 0), 0) + 1250000 + 3500000;
  const totalLiabilities = liabilities.reduce((s, a) => s + (a.parentCode ? a.balance : 0), 0);
  const totalEquity = equity.reduce((s, a) => s + (a.parentCode ? a.balance : 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Financial Reports</h1>
          <p className="text-sm text-muted-foreground">Generated statements and reports</p>
        </div>
        <button className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted text-sm text-muted-foreground hover:text-foreground transition-colors">
          <Download className="w-4 h-4" /> Export PDF
        </button>
      </div>

      {/* Report Tabs */}
      <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
        {reports.map(r => (
          <button
            key={r.id}
            onClick={() => setActiveReport(r.id)}
            className={cn(
              "px-4 py-2 rounded-md text-sm font-medium transition-colors",
              activeReport === r.id
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Trial Balance */}
      {activeReport === 'trial-balance' && (
        <div className="glass-card overflow-hidden animate-fade-in">
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" /> Trial Balance
            </h2>
            <p className="text-xs text-muted-foreground">As of March 2, 2026</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Code</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Account</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">Debit</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">Credit</th>
              </tr>
            </thead>
            <tbody>
              {chartOfAccounts.filter(a => a.parentCode).map(a => (
                <tr key={a.code} className="border-b border-border/50 table-row-hover">
                  <td className="py-3 px-4 font-mono text-xs">{a.code}</td>
                  <td className="py-3 px-4">{a.name}</td>
                  <td className="py-3 px-4 text-right font-mono">
                    {['asset', 'expense'].includes(a.type) ? formatCurrency(a.balance) : '—'}
                  </td>
                  <td className="py-3 px-4 text-right font-mono">
                    {['liability', 'equity', 'income'].includes(a.type) ? formatCurrency(a.balance) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-primary/30 bg-muted/30">
                <td colSpan={2} className="py-3 px-4 font-bold">Total</td>
                <td className="py-3 px-4 text-right font-mono font-bold">
                  {formatCurrency(chartOfAccounts.filter(a => a.parentCode && ['asset', 'expense'].includes(a.type)).reduce((s, a) => s + a.balance, 0))}
                </td>
                <td className="py-3 px-4 text-right font-mono font-bold">
                  {formatCurrency(chartOfAccounts.filter(a => a.parentCode && ['liability', 'equity', 'income'].includes(a.type)).reduce((s, a) => s + a.balance, 0))}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* P&L */}
      {activeReport === 'pnl' && (
        <div className="glass-card overflow-hidden animate-fade-in">
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" /> Profit & Loss Statement
            </h2>
            <p className="text-xs text-muted-foreground">For the period ending March 2, 2026</p>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-income mb-2">Revenue</h3>
              {income.filter(a => a.parentCode).map(a => (
                <div key={a.code} className="flex justify-between py-2 pl-4 border-b border-border/30">
                  <span className="text-sm">{a.name}</span>
                  <span className="font-mono text-sm">{formatCurrency(a.balance)}</span>
                </div>
              ))}
              <div className="flex justify-between py-2 pl-4 font-semibold">
                <span>Total Revenue</span>
                <span className="font-mono text-income">{formatCurrency(totalIncome)}</span>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-expense mb-2">Expenses</h3>
              {expenses.filter(a => a.parentCode).map(a => (
                <div key={a.code} className="flex justify-between py-2 pl-4 border-b border-border/30">
                  <span className="text-sm">{a.name}</span>
                  <span className="font-mono text-sm">{formatCurrency(a.balance)}</span>
                </div>
              ))}
              <div className="flex justify-between py-2 pl-4 font-semibold">
                <span>Total Expenses</span>
                <span className="font-mono text-expense">{formatCurrency(totalExpenses)}</span>
              </div>
            </div>
            <div className="border-t-2 border-primary/30 pt-3">
              <div className="flex justify-between font-bold text-lg">
                <span>Net Profit</span>
                <span className={cn("font-mono", netProfit >= 0 ? "text-income" : "text-expense")}>
                  {formatCurrency(netProfit)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Balance Sheet */}
      {activeReport === 'balance-sheet' && (
        <div className="glass-card overflow-hidden animate-fade-in">
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" /> Balance Sheet
            </h2>
            <p className="text-xs text-muted-foreground">As of March 2, 2026</p>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-primary mb-2">Assets</h3>
              {assets.filter(a => a.parentCode).map(a => (
                <div key={a.code} className="flex justify-between py-2 pl-4 border-b border-border/30">
                  <span className="text-sm">{a.name}</span>
                  <span className="font-mono text-sm">{formatCurrency(a.balance)}</span>
                </div>
              ))}
              <div className="flex justify-between py-2 pl-4 font-semibold">
                <span>Total Assets</span>
                <span className="font-mono">{formatCurrency(totalAssets)}</span>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-expense mb-2">Liabilities</h3>
              {liabilities.filter(a => a.parentCode).map(a => (
                <div key={a.code} className="flex justify-between py-2 pl-4 border-b border-border/30">
                  <span className="text-sm">{a.name}</span>
                  <span className="font-mono text-sm">{formatCurrency(a.balance)}</span>
                </div>
              ))}
              <div className="flex justify-between py-2 pl-4 font-semibold">
                <span>Total Liabilities</span>
                <span className="font-mono">{formatCurrency(totalLiabilities)}</span>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-income mb-2">Equity</h3>
              {equity.filter(a => a.parentCode).map(a => (
                <div key={a.code} className="flex justify-between py-2 pl-4 border-b border-border/30">
                  <span className="text-sm">{a.name}</span>
                  <span className="font-mono text-sm">{formatCurrency(a.balance)}</span>
                </div>
              ))}
              <div className="flex justify-between py-2 pl-4 font-semibold">
                <span>Total Equity</span>
                <span className="font-mono">{formatCurrency(totalEquity)}</span>
              </div>
            </div>
            <div className="border-t-2 border-primary/30 pt-3 flex justify-between font-bold text-lg">
              <span>Liabilities + Equity</span>
              <span className="font-mono">{formatCurrency(totalLiabilities + totalEquity)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Cash Flow */}
      {activeReport === 'cash-flow' && (
        <div className="glass-card overflow-hidden animate-fade-in">
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" /> Cash Flow Statement
            </h2>
            <p className="text-xs text-muted-foreground">Monthly summary</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Month</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">Inflow</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">Outflow</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">Net Cash Flow</th>
              </tr>
            </thead>
            <tbody>
              {monthlyData.map(m => {
                const net = m.income - m.expenses;
                return (
                  <tr key={m.month} className="border-b border-border/50 table-row-hover">
                    <td className="py-3 px-4 font-medium">{m.month}</td>
                    <td className="py-3 px-4 text-right font-mono text-income">{formatCurrency(m.income)}</td>
                    <td className="py-3 px-4 text-right font-mono text-expense">{formatCurrency(m.expenses)}</td>
                    <td className={cn("py-3 px-4 text-right font-mono font-medium", net >= 0 ? "text-income" : "text-expense")}>
                      {formatCurrency(net)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-primary/30 bg-muted/30">
                <td className="py-3 px-4 font-bold">Total</td>
                <td className="py-3 px-4 text-right font-mono font-bold text-income">
                  {formatCurrency(monthlyData.reduce((s, m) => s + m.income, 0))}
                </td>
                <td className="py-3 px-4 text-right font-mono font-bold text-expense">
                  {formatCurrency(monthlyData.reduce((s, m) => s + m.expenses, 0))}
                </td>
                <td className="py-3 px-4 text-right font-mono font-bold text-income">
                  {formatCurrency(monthlyData.reduce((s, m) => s + m.income - m.expenses, 0))}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
