import { ledgerEntries, formatCurrency } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { Filter, Download } from "lucide-react";

export default function GeneralLedger() {
  const totalDebit = ledgerEntries.reduce((s, e) => s + e.debit, 0);
  const totalCredit = ledgerEntries.reduce((s, e) => s + e.credit, 0);
  const isBalanced = totalDebit === totalCredit;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">General Ledger</h1>
          <p className="text-sm text-muted-foreground">Double-entry accounting records</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted text-sm text-muted-foreground hover:text-foreground transition-colors">
            <Filter className="w-4 h-4" /> Filters
          </button>
          <button className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted text-sm text-muted-foreground hover:text-foreground transition-colors">
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      {/* Balance Status */}
      <div className={cn(
        "glass-card p-4 flex items-center gap-3 animate-fade-in",
        isBalanced ? "border-income/30" : "border-expense/30"
      )}>
        <div className={cn("w-3 h-3 rounded-full", isBalanced ? "bg-income" : "bg-expense")} />
        <div>
          <p className="text-sm font-medium">
            Ledger is {isBalanced ? "balanced" : "unbalanced"}
          </p>
          <p className="text-xs text-muted-foreground">
            Total Debits: {formatCurrency(totalDebit)} &nbsp;|&nbsp; Total Credits: {formatCurrency(totalCredit)}
          </p>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="glass-card overflow-hidden animate-fade-in">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Date</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Txn ID</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Account</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Description</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Bank</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">Debit</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">Credit</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">Balance</th>
              </tr>
            </thead>
            <tbody>
              {ledgerEntries.map((entry) => (
                <tr key={entry.id} className="border-b border-border/50 table-row-hover transition-colors">
                  <td className="py-3 px-4 font-mono text-xs text-muted-foreground">{entry.date}</td>
                  <td className="py-3 px-4 font-mono text-xs text-primary">{entry.transactionId}</td>
                  <td className="py-3 px-4">
                    <div>
                      <span className="font-mono text-xs text-muted-foreground mr-2">{entry.accountCode}</span>
                      <span>{entry.accountName}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">{entry.description}</td>
                  <td className="py-3 px-4 text-muted-foreground">{entry.bankName}</td>
                  <td className={cn("py-3 px-4 text-right font-mono", entry.debit > 0 && "text-expense")}>
                    {entry.debit > 0 ? formatCurrency(entry.debit) : "—"}
                  </td>
                  <td className={cn("py-3 px-4 text-right font-mono", entry.credit > 0 && "text-income")}>
                    {entry.credit > 0 ? formatCurrency(entry.credit) : "—"}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-medium">{formatCurrency(entry.balance)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-primary/30 bg-muted/30">
                <td colSpan={5} className="py-3 px-4 font-semibold">Totals</td>
                <td className="py-3 px-4 text-right font-mono font-bold text-expense">{formatCurrency(totalDebit)}</td>
                <td className="py-3 px-4 text-right font-mono font-bold text-income">{formatCurrency(totalCredit)}</td>
                <td className="py-3 px-4"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
