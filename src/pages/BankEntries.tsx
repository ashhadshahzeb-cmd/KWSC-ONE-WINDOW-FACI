import { useState } from "react";
import { bankAccounts, transactions, formatCurrency, Transaction } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight, Plus } from "lucide-react";
import { toast } from "sonner";

export default function BankEntries() {
  const [selectedBankId, setSelectedBankId] = useState<string>("");
  
  // Credit Form State
  const [cDate, setCDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [cAmount, setCAmount] = useState<string>("");
  const [cDescription, setCDescription] = useState<string>("");
  const [cIsTransfer, setCIsTransfer] = useState<boolean>(false);
  const [cFromBankId, setCFromBankId] = useState<string>("");

  // Debit Form State
  const [dDate, setDDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [dAmount, setDAmount] = useState<string>("");
  const [dDescription, setDDescription] = useState<string>("");
  const [dIsTransfer, setDIsTransfer] = useState<boolean>(false);
  const [dToBankId, setDToBankId] = useState<string>("");
  
  // Local state to hold the entries
  const [localTransactions, setLocalTransactions] = useState<Transaction[]>(transactions);

  const selectedBank = bankAccounts.find(b => b.id === selectedBankId);

  const handleAddEntry = (
    type: 'credit' | 'debit',
    isTransfer: boolean,
    date: string,
    amount: string,
    description: string,
    otherBankId: string
  ) => {
    if (!selectedBankId) {
      toast.error("Please select an active bank account");
      return;
    }
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (!description) {
      toast.error("Please enter a description");
      return;
    }
    if (isTransfer && !otherBankId) {
      toast.error(`Please select the ${type === 'credit' ? 'source' : 'destination'} bank`);
      return;
    }

    const otherBank = bankAccounts.find(b => b.id === otherBankId);

    if (isTransfer) {
      const newTransaction1: Transaction = {
        id: `t${Date.now()}-1`,
        date,
        description: type === 'credit' ? `${description} (From ${otherBank?.bankName})` : `${description} (To ${otherBank?.bankName})`,
        amount: Number(amount),
        type: type,
        category: 'Fund Transfer',
        accountCode: '0000',
        bankAccountId: selectedBankId,
        bankName: selectedBank?.bankName || '',
        status: 'pending',
        reference: `TRF-${Date.now().toString().slice(-4)}`
      };
      
      const newTransaction2: Transaction = {
        id: `t${Date.now()}-2`,
        date,
        description: type === 'credit' ? `${description} (To ${selectedBank?.bankName})` : `${description} (From ${selectedBank?.bankName})`,
        amount: Number(amount),
        type: type === 'credit' ? 'debit' : 'credit',
        category: 'Fund Transfer',
        accountCode: '0000',
        bankAccountId: otherBankId,
        bankName: otherBank?.bankName || '',
        status: 'pending',
        reference: `TRF-${Date.now().toString().slice(-4)}`
      };
      
      setLocalTransactions([newTransaction1, newTransaction2, ...localTransactions]);
      toast.success('Fund transfer recorded successfully');
    } else {
      const newTransaction: Transaction = {
        id: `t${Date.now()}`,
        date,
        description,
        amount: Number(amount),
        type: type,
        category: 'General',
        accountCode: '0000',
        bankAccountId: selectedBankId,
        bankName: selectedBank?.bankName || '',
        status: 'pending',
        reference: `ENT-${Date.now().toString().slice(-4)}`
      };

      setLocalTransactions([newTransaction, ...localTransactions]);
      toast.success(`${type === 'credit' ? 'Credit' : 'Debit'} entry added successfully`);
    }

    // Reset specific form states
    if (type === 'credit') {
      setCAmount("");
      setCDescription("");
      setCFromBankId("");
    } else {
      setDAmount("");
      setDDescription("");
      setDToBankId("");
    }
  };

  const bankTransactions = localTransactions.filter(t => t.bankAccountId === selectedBankId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Bank Entry</h1>
          <p className="text-sm text-muted-foreground">Manage credits, debits and fund transfers between accounts</p>
        </div>
      </div>

      {/* Top Banner: Bank Selection */}
      <div className="glass-card p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="w-full max-w-sm space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Active Bank Account</label>
            <select 
              value={selectedBankId} 
              onChange={(e) => setSelectedBankId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-muted border border-border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
            >
              <option value="">-- Select Active Bank --</option>
              {bankAccounts.map(bank => (
                <option key={bank.id} value={bank.id}>
                  {bank.bankName} - {bank.maskedNumber}
                </option>
              ))}
            </select>
          </div>
          {selectedBank && (
            <div className="flex items-center gap-4 bg-primary/5 border border-primary/10 p-4 rounded-xl animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                <ArrowUpRight className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Available Balance</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-foreground">{formatCurrency(selectedBank.balance).split(' ')[0]}</span>
                  <span className="text-xl font-bold text-primary">{formatCurrency(selectedBank.balance).split(' ')[1]}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Credit Section (Left) */}
        <div className="glass-card p-6 border-t-4 border-t-income hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-income flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-income/10">
                <ArrowUpRight className="w-5 h-5" />
              </div>
              Credit Entry
            </h3>
            <span className="text-[10px] bg-income/10 text-income px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter">Income</span>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border/50">
              <input 
                type="checkbox" 
                id="c-transfer"
                checked={cIsTransfer}
                onChange={(e) => setCIsTransfer(e.target.checked)}
                className="w-4 h-4 rounded border-border text-income focus:ring-income"
              />
              <label htmlFor="c-transfer" className="text-sm font-semibold cursor-pointer select-none">Fund Transfer Mode</label>
            </div>

            {cIsTransfer && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                  FROM BANK ACCOUNT
                </label>
                <select 
                  value={cFromBankId} 
                  onChange={(e) => setCFromBankId(e.target.value)}
                  className="w-full px-3 py-2 rounded-md bg-background border border-border text-sm focus:ring-1 focus:ring-income"
                >
                  <option value="">-- Choose Source Bank --</option>
                  {bankAccounts.filter(b => b.id !== selectedBankId).map(bank => (
                    <option key={bank.id} value={bank.id}>
                      {bank.bankName} ({bank.maskedNumber})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground">DATE</label>
              <input 
                type="date" 
                value={cDate}
                onChange={(e) => setCDate(e.target.value)}
                className="w-full px-3 py-2 rounded-md bg-muted/30 border border-border text-sm focus:bg-background transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground">AMOUNT</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono">$</span>
                <input 
                  type="number" 
                  value={cAmount}
                  onChange={(e) => setCAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-7 pr-3 py-2 rounded-md bg-muted/30 border border-border text-sm font-mono focus:bg-background transition-colors"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground">DESCRIPTION</label>
              <input 
                type="text" 
                value={cDescription}
                onChange={(e) => setCDescription(e.target.value)}
                placeholder="e.g. Server Payment, Invoice #123..."
                className="w-full px-3 py-2 rounded-md bg-muted/30 border border-border text-sm focus:bg-background transition-colors"
              />
            </div>

            <button 
              onClick={() => handleAddEntry('credit', cIsTransfer, cDate, cAmount, cDescription, cFromBankId)}
              className="w-full py-2.5 rounded-lg bg-income text-white text-sm font-bold hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-2 shadow-md shadow-income/20"
            >
              <Plus className="w-4 h-4" /> Record Credit
            </button>
          </div>
        </div>

        {/* Debit Section (Right) */}
        <div className="glass-card p-6 border-t-4 border-t-expense hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-expense flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-expense/10">
                <ArrowDownRight className="w-5 h-5" />
              </div>
              Debit Entry
            </h3>
            <span className="text-[10px] bg-expense/10 text-expense px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter">Expense</span>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border/50">
              <input 
                type="checkbox" 
                id="d-transfer"
                checked={dIsTransfer}
                onChange={(e) => setDIsTransfer(e.target.checked)}
                className="w-4 h-4 rounded border-border text-expense focus:ring-expense"
              />
              <label htmlFor="d-transfer" className="text-sm font-semibold cursor-pointer select-none">Fund Transfer Mode</label>
            </div>

            {dIsTransfer && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="text-xs font-bold text-muted-foreground">TO BANK ACCOUNT</label>
                <select 
                  value={dToBankId} 
                  onChange={(e) => setDToBankId(e.target.value)}
                  className="w-full px-3 py-2 rounded-md bg-background border border-border text-sm focus:ring-1 focus:ring-expense"
                >
                  <option value="">-- Choose Destination Bank --</option>
                  {bankAccounts.filter(b => b.id !== selectedBankId).map(bank => (
                    <option key={bank.id} value={bank.id}>
                      {bank.bankName} ({bank.maskedNumber})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground">DATE</label>
              <input 
                type="date" 
                value={dDate}
                onChange={(e) => setDDate(e.target.value)}
                className="w-full px-3 py-2 rounded-md bg-muted/30 border border-border text-sm focus:bg-background transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground">AMOUNT</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono">$</span>
                <input 
                  type="number" 
                  value={dAmount}
                  onChange={(e) => setDAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-7 pr-3 py-2 rounded-md bg-muted/30 border border-border text-sm font-mono focus:bg-background transition-colors"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground">DESCRIPTION</label>
              <input 
                type="text" 
                value={dDescription}
                onChange={(e) => setDDescription(e.target.value)}
                placeholder="e.g. Office Rent, Utility Bill..."
                className="w-full px-3 py-2 rounded-md bg-muted/30 border border-border text-sm focus:bg-background transition-colors"
              />
            </div>

            <button 
              onClick={() => handleAddEntry('debit', dIsTransfer, dDate, dAmount, dDescription, dToBankId)}
              className="w-full py-2.5 rounded-lg bg-expense text-white text-sm font-bold hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-2 shadow-md shadow-expense/20"
            >
              <Plus className="w-4 h-4" /> Record Debit
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Section: Entries Table (Full Width) */}
      <div className="glass-card overflow-hidden border-border/50">
        <div className="p-5 border-b border-border bg-muted/20 flex justify-between items-center">
          <h2 className="text-lg font-bold flex items-center gap-2">
            Transaction History
            {selectedBank && <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-1 rounded">Filtering by {selectedBank.bankName}</span>}
          </h2>
        </div>

        <div className="overflow-x-auto">
          {!selectedBankId ? (
            <div className="p-20 text-center text-muted-foreground flex flex-col items-center justify-center gap-4">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <Plus className="w-8 h-8 opacity-20" />
              </div>
              <div>
                <p className="text-lg font-semibold text-foreground/70">No Bank Selected</p>
                <p className="text-sm">Please select an active bank account from the top to view its ledger entries.</p>
              </div>
            </div>
          ) : bankTransactions.length === 0 ? (
            <div className="p-20 text-center text-muted-foreground bg-muted/5">
              <p className="text-lg font-medium">No records found</p>
              <p className="text-sm">This bank account doesn't have any transaction entries yet.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left py-4 px-6 text-xs font-black text-muted-foreground uppercase tracking-widest">Date</th>
                  <th className="text-left py-4 px-6 text-xs font-black text-muted-foreground uppercase tracking-widest">Reference</th>
                  <th className="text-left py-4 px-6 text-xs font-black text-muted-foreground uppercase tracking-widest">Description</th>
                  <th className="text-right py-4 px-6 text-xs font-black text-muted-foreground uppercase tracking-widest">Amount</th>
                  <th className="text-center py-4 px-6 text-xs font-black text-muted-foreground uppercase tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody>
                {bankTransactions.map((t) => (
                  <tr key={t.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors group">
                    <td className="py-4 px-6 font-mono text-xs text-muted-foreground">{t.date}</td>
                    <td className="py-4 px-6 font-mono text-xs text-primary font-bold">{t.reference}</td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "p-1 rounded-full",
                          t.type === 'credit' ? "bg-income/10" : "bg-expense/10"
                        )}>
                          {t.type === 'credit' ? (
                            <ArrowUpRight className="w-3.5 h-3.5 text-income" />
                          ) : (
                            <ArrowDownRight className="w-3.5 h-3.5 text-expense" />
                          )}
                        </div>
                        <span className="font-medium">{t.description}</span>
                      </div>
                    </td>
                    <td className={cn("py-4 px-6 text-right font-mono font-bold text-base", t.type === 'credit' ? "text-income" : "text-expense")}>
                      {t.type === 'credit' ? '+' : '-'}{formatCurrency(t.amount)}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={cn(
                        "text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-tight",
                        t.status === 'reconciled' && "bg-primary/10 text-primary",
                        t.status === 'approved' && "bg-income/10 text-income",
                        t.status === 'pending' && "bg-warning/10 text-warning",
                      )}>
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
