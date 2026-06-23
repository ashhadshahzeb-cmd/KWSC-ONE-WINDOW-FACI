import { bankAccounts, formatCurrency } from "@/lib/mock-data";
import { Landmark, Plus, RefreshCw, Wifi } from "lucide-react";
import { cn } from "@/lib/utils";

export default function BankAccounts() {
  const totalPKR = bankAccounts.filter(b => b.currency === 'PKR').reduce((s, b) => s + b.balance, 0);
  const totalUSD = bankAccounts.filter(b => b.currency === 'USD').reduce((s, b) => s + b.balance, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bank Accounts</h1>
          <p className="text-sm text-muted-foreground">Multi-bank management & API connections</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" /> Add Bank
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="glass-card p-5 animate-fade-in">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Balance (PKR)</p>
          <p className="text-3xl font-bold font-mono text-primary">{formatCurrency(totalPKR)}</p>
        </div>
        <div className="glass-card p-5 animate-fade-in">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Balance (USD)</p>
          <p className="text-3xl font-bold font-mono text-primary">{formatCurrency(totalUSD, 'USD')}</p>
        </div>
      </div>

      {/* Bank Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {bankAccounts.map((bank) => (
          <div key={bank.id} className="glass-card p-5 animate-fade-in group hover:border-primary/30 transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${bank.color}20` }}>
                  <Landmark className="w-5 h-5" style={{ color: bank.color }} />
                </div>
                <div>
                  <h3 className="font-semibold">{bank.bankName}</h3>
                  <p className="text-xs text-muted-foreground">{bank.accountTitle}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Wifi className="w-3 h-3 text-income" />
                <span className="text-[10px] text-income font-medium uppercase">Live</span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Account Number</p>
                <p className="font-mono text-sm">{bank.maskedNumber}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Current Balance</p>
                <p className="text-xl font-bold font-mono">{formatCurrency(bank.balance, bank.currency)}</p>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-border/50">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase">Opening</p>
                  <p className="font-mono text-xs">{formatCurrency(bank.openingBalance, bank.currency)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-muted-foreground uppercase">Currency</p>
                  <p className="font-mono text-xs">{bank.currency}</p>
                </div>
              </div>
            </div>

            <button className="mt-4 w-full flex items-center justify-center gap-2 py-2 rounded-md bg-muted text-xs text-muted-foreground hover:text-foreground transition-colors">
              <RefreshCw className="w-3 h-3" /> Sync Transactions
            </button>
          </div>
        ))}
      </div>

      {/* API Integration Info */}
      <div className="glass-card p-5 animate-fade-in border-dashed">
        <h3 className="text-sm font-semibold mb-2">Bank API Integration</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          API connectors are available for HBL, Meezan, UBL, and Standard Chartered. Transactions are fetched in real-time where supported.
          For banks without API access, CSV import and manual entry are available as fallbacks. Webhook support can be enabled for auto-sync.
        </p>
      </div>
    </div>
  );
}
