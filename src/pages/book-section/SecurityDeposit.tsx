import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Lock, FileText, Landmark, Search, Save, RotateCcw, ShieldCheck, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function SecurityDeposit() {
  const navigate = useNavigate();
  const location = useLocation();
  const navState = location.state as any;
  
  // Records State
  const [records, setRecords] = useState<any[]>([]);
  
  // States
  const [yearSD, setYearSD] = useState("");
  const [budgetHead, setBudgetHead] = useState("");
  const [partyCode, setPartyCode] = useState("");
  const [vendorName, setVendorName] = useState("");
  const [zoneWise, setZoneWise] = useState("");
  const [voucherNo, setVoucherNo] = useState("");
  const [voucherDate, setVoucherDate] = useState("");
  const [billPassedOn, setBillPassedOn] = useState("");
  const [grossAmount, setGrossAmount] = useState("0");
  const [receivingStatus, setReceivingStatus] = useState("");
  const [chequeNo, setChequeNo] = useState("");
  const [balanceAmount, setBalanceAmount] = useState("0");
  const [paymentDate, setPaymentDate] = useState("");
  const [vendorType, setVendorType] = useState("security_deposit");

  // Search States
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState("party");
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Derived Values
  const netAmount = parseFloat(grossAmount) || 0;

  const fetchRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('security_deposits' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
        
      if (error) throw error;
      if (data) setRecords(data);
    } catch (err) {
      console.error("Error fetching security records:", err);
    }
  };

  useEffect(() => {
    fetchRecords();

    // Check if data is coming from Bill Dispatch (navState)
    if (navState) {
        if (navState.vendorName || navState.contractorName) setVendorName(navState.vendorName || navState.contractorName);
        if (navState.grossAmount) setGrossAmount(navState.grossAmount.toString());
        if (navState.voucherNo) setVoucherNo(navState.voucherNo);
        if (navState.partyCode) setPartyCode(navState.partyCode);
        toast.success("Data imported from Bill Dispatch");
        // Clear history state
        window.history.replaceState({}, document.title);
    }
  }, [navState]);

  const handleReset = (silent = false) => {
    setYearSD("");
    setBudgetHead("");
    setPartyCode("");
    setVendorName("");
    setZoneWise("");
    setVoucherNo("");
    setVoucherDate("");
    setBillPassedOn("");
    setGrossAmount("0");
    setReceivingStatus("");
    setChequeNo("");
    setBalanceAmount("0");
    setPaymentDate("");
    setVendorType("security_deposit");
    setErrors({});
    if (!silent) toast.info("Form reset successfully.");
  };

  const handleSave = async () => {
    const newErrors: Record<string, string> = {};
    if (!vendorName.trim()) newErrors.vendorName = "Vendor Name is required";
    if (!partyCode.trim()) newErrors.partyCode = "Party Code is required";
    if (!voucherNo.trim()) newErrors.voucherNo = "Voucher No is required";
    if (parseFloat(grossAmount) <= 0) newErrors.grossAmount = "Amount must be greater than 0";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Please fill required fields!");
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase.from('security_deposits' as any).insert({
        year_sd: yearSD || null,
        budget_head: budgetHead,
        party_code: partyCode,
        vendor_name: vendorName,
        zone_wise: zoneWise,
        voucher_no: voucherNo,
        voucher_date: voucherDate || null,
        bill_passed_on: billPassedOn || null,
        payment_date: paymentDate || null,
        gross_amount: parseFloat(grossAmount) || 0,
        net_amount: netAmount,
        receiving_status: receivingStatus,
        cheque_no: chequeNo,
        balance_amount: parseFloat(balanceAmount) || 0,
        vendor_type: vendorType,
        status: 'active'
      });

      if (error) throw error;
      toast.success("Security Deposit saved!");
      await fetchRecords(); // Refresh the grid
      handleReset(true);
      
      setTimeout(() => {
        toast.info("Redirecting to Cheque Entries...");
        navigate('/book-section/cheque-record', { 
          state: { 
            empName: vendorName, 
            empNo: partyCode, 
            pensionNo: "",
            empStatus: "security_deposit",
            totalAmount: grossAmount,
            remainingBalance: balanceAmount
          } 
        });
      }, 1500);
    } catch (err: any) {
      toast.error("Database error: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery) return toast.warning("Enter search value.");
    setIsSearching(true);
    try {
      const column = searchType === 'party' ? 'party_code' : 'voucher_no';
      const { data, error } = await supabase
        .from('security_deposits' as any)
        .select('*')
        .eq(column, searchQuery)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setYearSD(data.year_sd || "");
        setBudgetHead(data.budget_head || "");
        setPartyCode(data.party_code || "");
        setVendorName(data.vendor_name || "");
        setZoneWise(data.zone_wise || "");
        setVoucherNo(data.voucher_no || "");
        setVoucherDate(data.voucher_date || "");
        setBillPassedOn(data.bill_passed_on || "");
        setPaymentDate(data.payment_date || "");
        setGrossAmount(data.gross_amount?.toString() || "0");
        setReceivingStatus(data.receiving_status || "");
        setChequeNo(data.cheque_no || "");
        setBalanceAmount(data.balance_amount?.toString() || "0");
        toast.success("Record loaded!");
      } else {
        toast.error("No record found.");
      }
    } catch (err: any) {
      toast.error("Search failed: " + err.message);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Security Deposits</h1>
          <p className="text-sm text-muted-foreground italic">Vendor security deposit tracking system</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => handleReset()} className="gap-2 border-primary/20">
            <RotateCcw className="w-4 h-4" /> Reset
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isSaving} className="gap-2 bg-primary hover:bg-primary/90">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Record
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <Card className="glass-card overflow-hidden border-none shadow-xl bg-white/5">
            <div className="h-1 bg-gradient-to-r from-primary to-amber-500" />
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 font-bold italic">
                <FileText className="w-5 h-5 text-primary" />
                Deposit Classification
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
              <div className="space-y-2">
                <Label className="text-xs uppercase font-bold text-muted-foreground">Year of S.D</Label>
                <Input type="date" value={yearSD} onChange={(e) => setYearSD(e.target.value)} className="bg-white/5 border-white/10" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase font-bold text-muted-foreground">Budget Head</Label>
                <Input value={budgetHead} onChange={(e) => setBudgetHead(e.target.value)} className="bg-white/5 border-white/10" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase font-bold text-muted-foreground">Party's Code <span className="text-red-400">*</span></Label>
                <Input value={partyCode} onChange={(e) => setPartyCode(e.target.value)} className={`bg-white/5 border-white/10 font-mono${errors.partyCode ? ' border-red-500' : ''}`} />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label className="text-xs uppercase font-bold text-muted-foreground">Name of Vendor <span className="text-red-400">*</span></Label>
                <Input value={vendorName} onChange={(e) => setVendorName(e.target.value)} className={`bg-white/5 border-white/10${errors.vendorName ? ' border-red-500' : ''}`} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase font-bold text-muted-foreground">Zone Wise</Label>
                <Input value={zoneWise} onChange={(e) => setZoneWise(e.target.value)} className="bg-white/5 border-white/10" />
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="glass-card overflow-hidden border-none bg-white/5">
              <div className="h-1 bg-amber-500/50" />
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 font-bold italic text-amber-300">
                  <Lock className="w-5 h-5 text-amber-400" />
                  Voucher Information
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase">Voucher No <span className="text-red-400">*</span></Label>
                    <Input value={voucherNo} onChange={(e) => setVoucherNo(e.target.value)} className={`bg-white/5 border-white/10 text-xs font-mono${errors.voucherNo ? ' border-red-500' : ''}`} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase">Voucher Date</Label>
                    <Input type="date" value={voucherDate} onChange={(e) => setVoucherDate(e.target.value)} className="bg-white/5 border-white/10 text-xs" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase">Bill Passed On</Label>
                  <Input type="date" value={billPassedOn} onChange={(e) => setBillPassedOn(e.target.value)} className="bg-white/5 border-white/10 text-xs" />
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card overflow-hidden border-none bg-white/5">
              <div className="h-1 bg-emerald-500/50" />
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 font-bold italic text-emerald-300">
                  <Landmark className="w-5 h-5 text-emerald-400" />
                  Financial Status
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase">Gross Amount <span className="text-red-400">*</span></Label>
                    <Input type="number" value={grossAmount} onChange={(e) => setGrossAmount(e.target.value)} className="bg-white/5 border-white/10 font-mono text-sm" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase text-emerald-400">Net Amount</Label>
                    <div className="h-9 w-full rounded-md border border-emerald-500/30 bg-emerald-500/10 flex items-center px-3 font-mono text-emerald-400 font-bold text-sm">
                      {netAmount.toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase">Receiving Status</Label>
                  <Input value={receivingStatus} onChange={(e) => setReceivingStatus(e.target.value)} className="bg-white/5 border-white/10 h-9" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="glass-card overflow-hidden border-none bg-white/5">
            <div className="h-1 bg-blue-500/50" />
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2 font-bold italic text-blue-300">
                <Landmark className="w-5 h-5 text-blue-400" />
                Payment Reconciliation
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase">Cheque Number</Label>
                <Input value={chequeNo} onChange={(e) => setChequeNo(e.target.value)} className="bg-white/5 border-white/10 font-mono h-9" />
              </div>
              <div className="space-y-2">
                 <Label className="text-[10px] font-bold uppercase">Balance Amount</Label>
                 <Input type="number" value={balanceAmount} onChange={(e) => setBalanceAmount(e.target.value)} className="bg-white/5 border-white/10 font-mono h-9" />
              </div>
              <div className="space-y-2">
                 <Label className="text-[10px] font-bold uppercase">Payment Date</Label>
                 <Input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} className="bg-white/5 border-white/10 h-9 text-xs" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="glass-card overflow-hidden border-none p-6 bg-white/5">
            <div className="space-y-4">
              <div className="flex items-center gap-2 bg-primary/20 text-primary px-3 py-1.5 rounded-md w-fit text-[10px] font-black italic border border-primary/20 uppercase">
                <ShieldCheck className="w-3.5 h-3.5" /> ID TYPE
              </div>
              <Select value={vendorType} onValueChange={setVendorType}>
                <SelectTrigger className="bg-white/5 border-white/10">
                  <SelectValue placeholder="Select Vendor" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-white/10">
                  <SelectItem value="medical">Medical</SelectItem>
                  <SelectItem value="contractor">Contractor</SelectItem>
                  <SelectItem value="security_deposit">Security Deposit</SelectItem>
                  <SelectItem value="pol_bills">POL Bills</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>

          <Card className="glass-card border-none bg-primary/5 p-4 border-t border-primary/10">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-rose-500 italic uppercase">Quick Search</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="Enter value..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 bg-black/40 border-primary/20 text-xs" 
                  />
                </div>
              </div>
              <RadioGroup value={searchType} onValueChange={setSearchType} className="grid grid-cols-1 gap-2">
                <div className="flex items-center gap-2 bg-white/5 p-2 rounded">
                  <RadioGroupItem value="party" id="sp-party" className="border-primary" />
                  <Label htmlFor="sp-party" className="text-[9px] font-bold uppercase cursor-pointer">By Party Code</Label>
                </div>
                <div className="flex items-center gap-2 bg-white/5 p-2 rounded">
                  <RadioGroupItem value="voucher" id="sp-voucher" className="border-primary" />
                  <Label htmlFor="sp-voucher" className="text-[9px] font-bold uppercase cursor-pointer">By Voucher No</Label>
                </div>
              </RadioGroup>
              <Button 
                onClick={handleSearch} 
                className="w-full bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 font-bold uppercase text-[10px]"
              >
                {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5 mr-2" />}
                SEARCH
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Records Table */}
      <Card className="glass-card overflow-hidden border-none shadow-md mt-6">
        <div className="h-2 bg-primary/50" />
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Recent Security Deposit Records
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border/50 overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Voucher No</TableHead>
                  <TableHead>Party Code</TableHead>
                  <TableHead>Vendor Name</TableHead>
                  <TableHead>Gross Amount</TableHead>
                  <TableHead>Net Amount</TableHead>
                  <TableHead>Receiving Status</TableHead>
                  <TableHead>Payment Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.length > 0 ? (
                  records.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium font-mono">{r.voucher_no}</TableCell>
                      <TableCell className="font-mono text-xs">{r.party_code}</TableCell>
                      <TableCell className="font-semibold">{r.vendor_name}</TableCell>
                      <TableCell className="font-mono text-xs italic">{r.gross_amount}</TableCell>
                      <TableCell className="font-mono font-bold text-primary">{r.net_amount}</TableCell>
                      <TableCell className="capitalize">{r.receiving_status}</TableCell>
                      <TableCell>{r.payment_date || 'N/A'}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-10 italic">No records found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
