import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Lock, 
  Plus, 
  Trash2, 
  Calculator,
  Calendar,
  RefreshCw,
  Loader2,
  CalendarDays
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface CollectionRecord {
  id: string;
  month: string;
  entry_date: string;
  wsc: number;
  wscc: number;
  iacc: number;
  wtr: number;
  isbc: number;
  ccc: number;
  asug: number;
  cssw: number;
}

const CollectionEntry = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [records, setRecords] = useState<CollectionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    month: "",
    entry_date: new Date().toISOString().split('T')[0],
    wsc: "",
    wscc: "",
    iacc: "",
    wtr: "",
    isbc: "",
    ccc: "",
    asug: "",
    cssw: "",
  });

  useEffect(() => {
    if (isAuthenticated) {
      fetchRecords();
    }
  }, [isAuthenticated]);

  const fetchRecords = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('daily_collections')
        .select('*')
        .order('entry_date', { ascending: false });

      if (error) throw error;
      setRecords(data || []);
    } catch (error: any) {
      console.error("Error fetching from Supabase:", error.message);
      const saved = localStorage.getItem('collection_records');
      if (saved) setRecords(JSON.parse(saved));
      toast.error("Using local data. Database sync failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "kwsc@786") {
      setIsAuthenticated(true);
      toast.success("Access Granted");
    } else {
      toast.error("Incorrect Password");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const addRecord = async () => {
    if (!formData.month || !formData.entry_date) {
      toast.error("Please enter Month and Date");
      return;
    }

    setIsSaving(true);
    const newEntry = {
      month: formData.month,
      entry_date: formData.entry_date,
      wsc: parseFloat(formData.wsc) || 0,
      wscc: parseFloat(formData.wscc) || 0,
      iacc: parseFloat(formData.iacc) || 0,
      wtr: parseFloat(formData.wtr) || 0,
      isbc: parseFloat(formData.isbc) || 0,
      ccc: parseFloat(formData.ccc) || 0,
      asug: parseFloat(formData.asug) || 0,
      cssw: parseFloat(formData.cssw) || 0,
    };

    try {
      const { data, error } = await supabase
        .from('daily_collections')
        .insert([newEntry])
        .select();

      if (error) throw error;

      if (data) {
        setRecords(prev => [data[0] as CollectionRecord, ...prev]);
        toast.success(`Record for ${formData.entry_date} saved to Cloud`);
      }

      setFormData({
        ...formData, wsc: "", wscc: "", iacc: "", wtr: "", isbc: "", ccc: "", asug: "", cssw: "",
      });
    } catch (error: any) {
      console.error("Error saving:", error.message);
      toast.error("Database error. Retrying locally...");
      const localEntry = { ...newEntry, id: Date.now().toString() };
      setRecords(prev => [localEntry as CollectionRecord, ...prev]);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteRecord = async (id: string) => {
    try {
      const { error } = await supabase
        .from('daily_collections')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setRecords(prev => prev.filter(r => r.id !== id));
      toast.info("Entry deleted");
    } catch (error: any) {
      setRecords(prev => prev.filter(r => r.id !== id));
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-PK', { minimumFractionDigits: 2 }).format(val);
  };

  const calculateTotals = () => {
    return records.reduce((acc, curr) => ({
      wsc: acc.wsc + curr.wsc,
      wscc: acc.wscc + curr.wscc,
      iacc: acc.iacc + curr.iacc,
      total_rrg: acc.total_rrg + (curr.wsc + curr.iacc),
      wtr: acc.wtr + curr.wtr,
      isbc: acc.isbc + curr.isbc,
      ccc: acc.ccc + curr.ccc,
      asug: acc.asug + curr.asug,
      cssw: acc.cssw + curr.cssw,
      total_others: acc.total_others + (curr.wtr + curr.isbc + curr.ccc + curr.asug + curr.cssw),
      grand_total: acc.grand_total + (curr.wsc + curr.iacc + curr.wtr + curr.isbc + curr.ccc + curr.asug + curr.cssw + curr.wscc)
    }), {
      wsc: 0, wscc: 0, iacc: 0, total_rrg: 0, wtr: 0, isbc: 0, ccc: 0, asug: 0, cssw: 0, total_others: 0, grand_total: 0
    });
  };

  const totals = calculateTotals();

  if (!isAuthenticated) {
    return (
      <div className="h-[80vh] flex items-center justify-center">
        <Card className="w-full max-w-md border-[#0ea5e9]/20 bg-[#09090b]/50 backdrop-blur-xl">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-[#0ea5e9]/10 flex items-center justify-center mb-4">
              <Lock className="w-8 h-8 text-[#0ea5e9]" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">Financial Access</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">Enter admin password to manage entries.</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-black/40 border-white/10" />
              <Button type="submit" className="w-full bg-[#0ea5e9] text-white font-bold">Unlock</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3 text-white">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Plus className="w-6 h-6 text-emerald-500" />
            </div>
            Entry Management
          </h1>
          <p className="text-muted-foreground mt-1 italic font-medium">Daily Statement Recording System</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="border-white/10 bg-white/5" onClick={fetchRecords} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Sync
          </Button>
        </div>
      </div>

      <Card className="border-white/10 bg-[#09090b]/40 backdrop-blur-md">
        <CardHeader className="bg-white/[0.02] border-b border-white/5 py-3">
          <CardTitle className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 text-[#0ea5e9]">
            <CalendarDays className="w-4 h-4" />
            New Entry Details
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-muted-foreground">Month & Year</label>
              <Input name="month" value={formData.month} onChange={handleInputChange} placeholder="JUL 2025" className="bg-white/5 border-white/10" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-muted-foreground">Entry Date</label>
              <Input type="date" name="entry_date" value={formData.entry_date} onChange={handleInputChange} className="bg-white/5 border-white/10 text-white" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-muted-foreground">Water & Sewerage</label>
              <Input type="number" name="wsc" value={formData.wsc} onChange={handleInputChange} placeholder="0.00" className="bg-white/5 border-white/10" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-muted-foreground">Connection Charges</label>
              <Input type="number" name="wscc" value={formData.wscc} onChange={handleInputChange} placeholder="0.00" className="bg-white/5 border-white/10" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-muted-foreground">Arrear Collection</label>
              <Input type="number" name="iacc" value={formData.iacc} onChange={handleInputChange} placeholder="0.00" className="bg-white/5 border-white/10" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-muted-foreground">Water Tanker</label>
              <Input type="number" name="wtr" value={formData.wtr} onChange={handleInputChange} placeholder="0.00" className="bg-white/5 border-white/10" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-muted-foreground">Infra Betterment</label>
              <Input type="number" name="isbc" value={formData.isbc} onChange={handleInputChange} placeholder="0.00" className="bg-white/5 border-white/10" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-muted-foreground">Commercialization</label>
              <Input type="number" name="ccc" value={formData.ccc} onChange={handleInputChange} placeholder="0.00" className="bg-white/5 border-white/10" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-muted-foreground">Auction Scrap</label>
              <Input type="number" name="asug" value={formData.asug} onChange={handleInputChange} placeholder="0.00" className="bg-white/5 border-white/10" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-muted-foreground">Sub Soil Water</label>
              <Input type="number" name="cssw" value={formData.cssw} onChange={handleInputChange} placeholder="0.00" className="bg-white/5 border-white/10" />
            </div>
            <div className="flex items-end lg:col-span-2">
              <Button onClick={addRecord} disabled={isSaving} className="w-full bg-[#0ea5e9] hover:bg-[#0ea5e9]/90 text-white font-bold h-10">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                Save Collection Entry
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-[#09090b]/60 backdrop-blur-xl overflow-hidden shadow-2xl">
        <div className="bg-white/[0.03] border-b border-white/10 p-4 text-center">
          <h2 className="text-xs font-black tracking-[0.2em] uppercase text-[#0ea5e9]">RECORDED COLLECTION STATEMENT</h2>
        </div>
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="p-20 flex flex-col items-center gap-4 text-muted-foreground">
              <Loader2 className="w-10 h-10 animate-spin text-[#0ea5e9]" />
              <p>Fetching cloud data...</p>
            </div>
          ) : (
            <table className="w-full border-collapse text-[10px]">
              <thead>
                <tr className="bg-white/5 border-b border-white/10">
                  <th rowSpan={2} className="p-2 border-r border-white/10 font-black uppercase text-center w-10">Act</th>
                  <th rowSpan={2} className="p-2 border-r border-white/10 font-black uppercase text-center w-24">Date</th>
                  <th rowSpan={2} className="p-2 border-r border-white/10 font-black uppercase text-center w-20">Month</th>
                  <th colSpan={4} className="p-2 border-r border-white/10 font-black uppercase text-center bg-[#0ea5e9]/10 text-[#0ea5e9]">RRG Collection</th>
                  <th colSpan={5} className="p-2 border-r border-white/10 font-black uppercase text-center bg-emerald-500/10 text-emerald-500">Other Collections</th>
                  <th rowSpan={2} className="p-2 font-black uppercase text-center bg-[#0ea5e9]/20 text-[#0ea5e9]">Grand Total</th>
                </tr>
                <tr className="bg-white/[0.02] border-b border-white/10 text-[8px]">
                  <th className="p-2 border-r border-white/10 uppercase">W&S</th>
                  <th className="p-2 border-r border-white/10 uppercase">Conn.</th>
                  <th className="p-2 border-r border-white/10 uppercase">Arrear</th>
                  <th className="p-2 border-r border-white/10 uppercase bg-[#0ea5e9]/5">Total RRG</th>
                  <th className="p-2 border-r border-white/10 uppercase">Tanker</th>
                  <th className="p-2 border-r border-white/10 uppercase">Infra</th>
                  <th className="p-2 border-r border-white/10 uppercase">Comm.</th>
                  <th className="p-2 border-r border-white/10 uppercase">Scrap</th>
                  <th className="p-2 border-r border-white/10 uppercase bg-emerald-500/5">Total Others</th>
                </tr>
              </thead>
              <tbody>
                {records.map((row) => (
                  <tr key={row.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="p-2 border-r border-white/10 text-center">
                      <Button variant="ghost" size="icon" onClick={() => deleteRecord(row.id)} className="h-6 w-6 text-rose-500">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </td>
                    <td className="p-2 border-r border-white/10 font-mono text-center">{row.entry_date}</td>
                    <td className="p-2 border-r border-white/10 font-black text-center">{row.month}</td>
                    <td className="p-2 border-r border-white/10 text-right font-mono">{formatCurrency(row.wsc)}</td>
                    <td className="p-2 border-r border-white/10 text-right font-mono">{formatCurrency(row.wscc)}</td>
                    <td className="p-2 border-r border-white/10 text-right font-mono">{formatCurrency(row.iacc)}</td>
                    <td className="p-2 border-r border-white/10 text-right font-mono font-bold bg-[#0ea5e9]/5">{formatCurrency(row.wsc + row.iacc)}</td>
                    <td className="p-2 border-r border-white/10 text-right font-mono">{formatCurrency(row.wtr)}</td>
                    <td className="p-2 border-r border-white/10 text-right font-mono">{formatCurrency(row.isbc)}</td>
                    <td className="p-2 border-r border-white/10 text-right font-mono">{formatCurrency(row.ccc)}</td>
                    <td className="p-2 border-r border-white/10 text-right font-mono">{formatCurrency(row.asug)}</td>
                    <td className="p-2 border-r border-white/10 text-right font-mono font-bold bg-emerald-500/5 text-emerald-500">{formatCurrency(row.wtr + row.isbc + row.ccc + row.asug + row.cssw)}</td>
                    <td className="p-2 text-right font-mono font-black bg-[#0ea5e9]/10 text-[#0ea5e9]">{formatCurrency(row.wsc + row.iacc + row.wtr + row.isbc + row.ccc + row.asug + row.cssw + row.wscc)}</td>
                  </tr>
                ))}
              </tbody>
              {records.length > 0 && (
                <tfoot>
                  <tr className="bg-[#0ea5e9]/10 border-t border-white/10 font-bold">
                    <td colSpan={3} className="p-2 text-center uppercase">Totals</td>
                    <td className="p-2 text-right font-mono">{formatCurrency(totals.wsc)}</td>
                    <td className="p-2 text-right font-mono">{formatCurrency(totals.wscc)}</td>
                    <td className="p-2 text-right font-mono">{formatCurrency(totals.iacc)}</td>
                    <td className="p-2 text-right font-mono bg-[#0ea5e9]/10">{formatCurrency(totals.total_rrg)}</td>
                    <td className="p-2 text-right font-mono">{formatCurrency(totals.wtr)}</td>
                    <td className="p-2 text-right font-mono">{formatCurrency(totals.isbc)}</td>
                    <td className="p-2 text-right font-mono">{formatCurrency(totals.ccc)}</td>
                    <td className="p-2 text-right font-mono">{formatCurrency(totals.asug)}</td>
                    <td className="p-2 text-right font-mono bg-emerald-500/10">{formatCurrency(totals.total_others)}</td>
                    <td className="p-2 text-right font-mono bg-[#0ea5e9] text-white">{formatCurrency(totals.grand_total)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CollectionEntry;
