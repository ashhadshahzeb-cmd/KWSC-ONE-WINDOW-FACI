import { transactions, formatCurrency } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight, Plus, Filter, Download, Search } from "lucide-react";
import { useState, useEffect } from "react";
import { useVoice } from "@/contexts/VoiceContext";

export default function Transactions() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const { searchQuery, setSearchQuery, formData, setFormData } = useVoice();

  // Sync voice search query with local search input
  useEffect(() => {
    if (searchQuery) {
      setSearch(searchQuery);
    }
    if (formData.filterStatus) {
      setStatusFilter(formData.filterStatus);
      // Clear after applying
      setFormData({ ...formData, filterStatus: undefined });
    }
    if (formData.filterType) {
      setTypeFilter(formData.filterType);
      // Clear after applying
      setFormData({ ...formData, filterType: undefined });
    }
  }, [searchQuery, formData, setFormData]);

  const filtered = transactions.filter(t => {
    if (search && !t.description.toLowerCase().includes(search.toLowerCase()) && !t.reference.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (typeFilter !== "all" && t.type !== typeFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Transactions</h1>
          <p className="text-sm text-muted-foreground">Manage all debit and credit entries</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" /> New Transaction
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              // Clear context search when typing manually
              if (searchQuery) setSearchQuery('');
            }}
            className="w-full pl-10 pr-4 py-2 rounded-md bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-md bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="all">All Status</option>
          <option value="approved">Approved</option>
          <option value="pending">Pending</option>
          <option value="reconciled">Reconciled</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 rounded-md bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="all">All Types</option>
          <option value="credit">Credit (Income)</option>
          <option value="debit">Debit (Expense)</option>
        </select>
        <button className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted text-sm text-muted-foreground hover:text-foreground transition-colors">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden animate-fade-in">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Date</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Reference</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Description</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Category</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Bank</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">Amount</th>
                <th className="text-center py-3 px-4 text-xs font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id} className="border-b border-border/50 table-row-hover transition-colors cursor-pointer">
                  <td className="py-3 px-4 font-mono text-xs text-muted-foreground">{t.date}</td>
                  <td className="py-3 px-4 font-mono text-xs text-primary">{t.reference}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {t.type === 'credit' ? (
                        <ArrowUpRight className="w-3.5 h-3.5 text-income shrink-0" />
                      ) : (
                        <ArrowDownRight className="w-3.5 h-3.5 text-expense shrink-0" />
                      )}
                      {t.description}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">{t.category}</td>
                  <td className="py-3 px-4 text-muted-foreground">{t.bankName}</td>
                  <td className={cn("py-3 px-4 text-right font-mono font-medium", t.type === 'credit' ? "text-income" : "text-expense")}>
                    {t.type === 'credit' ? '+' : '-'}{formatCurrency(t.amount)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={cn(
                      "text-xs px-2 py-1 rounded-full font-medium",
                      t.status === 'reconciled' && "bg-primary/10 text-primary",
                      t.status === 'approved' && "bg-success/10 text-income",
                      t.status === 'pending' && "bg-warning/10 text-warning",
                    )}>
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="p-8 text-center text-muted-foreground text-sm">No transactions found</div>
        )}
      </div>
    </div>
  );
}
