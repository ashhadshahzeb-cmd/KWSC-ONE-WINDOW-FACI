import { chartOfAccounts, formatCurrency } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { ChevronRight, Plus, Search } from "lucide-react";
import { useState, useEffect } from "react";
import { useVoice } from "@/contexts/VoiceContext";

const typeColors: Record<string, string> = {
  asset: "text-primary",
  liability: "text-expense",
  equity: "text-income",
  income: "text-income",
  expense: "text-expense",
};

const typeBadgeColors: Record<string, string> = {
  asset: "bg-primary/10 text-primary",
  liability: "bg-expense/10 text-expense",
  equity: "bg-income/10 text-income",
  income: "bg-income/10 text-income",
  expense: "bg-expense/10 text-expense",
};

export default function ChartOfAccounts() {
  const [search, setSearch] = useState("");
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set(['asset', 'liability', 'equity', 'income', 'expense']));
  const { searchQuery, setSearchQuery } = useVoice();

  useEffect(() => {
    if (searchQuery) {
      setSearch(searchQuery);
    }
  }, [searchQuery]);

  const parentAccounts = chartOfAccounts.filter(a => !a.parentCode);
  const getChildren = (parentCode: string) => chartOfAccounts.filter(a => a.parentCode === parentCode);

  const toggleType = (type: string) => {
    const next = new Set(expandedTypes);
    next.has(type) ? next.delete(type) : next.add(type);
    setExpandedTypes(next);
  };

  const filtered = search
    ? chartOfAccounts.filter(a => a.name.toLowerCase().includes(search.toLowerCase()) || a.code.includes(search))
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Chart of Accounts</h1>
          <p className="text-sm text-muted-foreground">Manage your account structure</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" /> Add Account
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search accounts..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            if (searchQuery) setSearchQuery('');
          }}
          className="w-full pl-10 pr-4 py-2 rounded-md bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {filtered ? (
        <div className="glass-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Code</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Account Name</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Type</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">Balance</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(a => (
                <tr key={a.code} className="border-b border-border/50 table-row-hover">
                  <td className="py-3 px-4 font-mono text-xs">{a.code}</td>
                  <td className="py-3 px-4">{a.name}</td>
                  <td className="py-3 px-4">
                    <span className={cn("text-xs px-2 py-1 rounded-full capitalize", typeBadgeColors[a.type])}>
                      {a.type}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono">{formatCurrency(a.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-3">
          {parentAccounts.map((parent) => {
            const children = getChildren(parent.code);
            const isExpanded = expandedTypes.has(parent.type);
            return (
              <div key={parent.code} className="glass-card overflow-hidden animate-fade-in">
                <button
                  onClick={() => toggleType(parent.type)}
                  className="flex items-center justify-between w-full p-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <ChevronRight className={cn("w-4 h-4 text-muted-foreground transition-transform", isExpanded && "rotate-90")} />
                    <span className="font-mono text-xs text-muted-foreground">{parent.code}</span>
                    <span className={cn("font-semibold", typeColors[parent.type])}>{parent.name}</span>
                    <span className={cn("text-xs px-2 py-0.5 rounded-full capitalize", typeBadgeColors[parent.type])}>
                      {parent.type}
                    </span>
                  </div>
                  <span className="font-mono font-medium">{formatCurrency(parent.balance)}</span>
                </button>
                {isExpanded && children.length > 0 && (
                  <div className="border-t border-border/50">
                    {children.map((child) => (
                      <div
                        key={child.code}
                        className="flex items-center justify-between px-4 py-3 pl-12 border-b border-border/30 last:border-0 table-row-hover transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs text-muted-foreground">{child.code}</span>
                          <span className="text-sm">{child.name}</span>
                        </div>
                        <span className="font-mono text-sm">{formatCurrency(child.balance)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
