import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Stethoscope, Calculator, Receipt, Search, Save, RotateCcw, Trash2, Loader2, FileImage, ImageIcon, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useVoice } from "@/contexts/VoiceContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function Medical() {
  const navigate = useNavigate();
  const location = useLocation();
  const { openModal, formData, setOpenModal } = useVoice();
  const navState = location.state as any;
  
  // Records State
  const [records, setRecords] = useState<any[]>([]);
  
  // Form States
  const [budgetYear, setBudgetYear] = useState("");
  const [budgetHead, setBudgetHead] = useState("");
  const [pmrVoucher, setPmrVoucher] = useState("");
  const [vendorName, setVendorName] = useState("");
  const [hospitalName, setHospitalName] = useState("");
  const [partyCode, setPartyCode] = useState("");
  const [voucherNo, setVoucherNo] = useState("");
  const [chequeNo, setChequeNo] = useState("");
  const [balanceAmount, setBalanceAmount] = useState("");
  
  const [incomeTax, setIncomeTax] = useState("0");
  const [grossAmount, setGrossAmount] = useState("0");
  const [billPassedOn, setBillPassedOn] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [vendorType, setVendorType] = useState("medical");
  const [scanUrl, setScanUrl] = useState<string | null>(null);
  const [trackingId, setTrackingId] = useState<string | null>(null);

  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState("party");
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Derived Values
  const netAmount = (parseFloat(grossAmount) || 0) - (parseFloat(incomeTax) || 0);

  const fetchRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('medical_billings' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
        
      if (error) throw error;
      if (data) setRecords(data);
    } catch (err) {
      console.error("Error fetching medical records:", err);
    }
  };

  useEffect(() => {
    fetchRecords();
    
    // Check if data is coming from Bill Dispatch (navState)
    if (navState) {
        if (navState.vendorName) setVendorName(navState.vendorName);
        if (navState.grossAmount) setGrossAmount(navState.grossAmount.toString());
        if (navState.voucherNo) setVoucherNo(navState.voucherNo);
        if (navState.partyCode) setPartyCode(navState.partyCode);
        if (navState.scanUrl) setScanUrl(navState.scanUrl);
        if (navState.trackingId) setTrackingId(navState.trackingId);
        toast.success("Data & Scan imported from Bill Dispatch");
        // Clear history state to avoid re-triggering on refresh
        window.history.replaceState({}, document.title);
    }

    if (openModal === 'medical') {
      if (formData.amount) setGrossAmount(formData.amount.toString());
      if (formData.name) setVendorName(formData.name);
      setOpenModal(null); // clear after filling
    }
  }, [openModal, formData, setOpenModal, navState]);

  const handleReset = (silent = false) => {
    setBudgetYear("");
    setBudgetHead("");
    setPmrVoucher("");
    setVendorName("");
    setHospitalName("");
    setScanUrl(null);
    setPartyCode("");
    setVoucherNo("");
    setChequeNo("");
    setBalanceAmount("");
    setIncomeTax("0");
    setGrossAmount("0");
    setBillPassedOn("");
    setPaymentDate("");
    setVendorType("medical");
    setErrors({});
    if (!silent) toast.info("Form reset successfully.");
  };

  const handleSave = async () => {
    const newErrors: Record<string, string> = {};
    if (!vendorName.trim()) newErrors.vendorName = "Vendor Name is required";
    if (!hospitalName.trim()) newErrors.hospitalName = "Hospital Name is required";
    if (!partyCode.trim()) newErrors.partyCode = "Party Code is required";
    if (!voucherNo.trim()) newErrors.voucherNo = "Voucher No is required";
    if (!grossAmount || parseFloat(grossAmount) <= 0) newErrors.grossAmount = "Gross Amount must be greater than 0";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error(`${Object.keys(newErrors).length} required field(s) incomplete!`);
      return;
    }
    setErrors({});

    setIsSaving(true);
    try {
      const { error } = await supabase.from('medical_billings' as any).insert({
        budget_year: budgetYear ? new Date(budgetYear).toISOString().split('T')[0] : null,
        budget_head: budgetHead,
        hospital_name: hospitalName,
        vendor_name: vendorName,
        party_code: partyCode,
        pmr_voucher: pmrVoucher,
        voucher_no: voucherNo,
        bill_passed_on: billPassedOn || null,
        gross_amount: parseFloat(grossAmount) || 0,
        income_tax: parseFloat(incomeTax) || 0,
        net_amount: netAmount,
        cheque_no: chequeNo,
        payment_date: paymentDate || null,
        balance_amount: parseFloat(balanceAmount) || 0,
        vendor_type: vendorType
      });

      if (error) throw error;
      toast.success("Medical record saved to database!");
      await fetchRecords(); // Refresh the grid immediately
      handleReset(true);
      setTimeout(() => {
        toast.info("Redirecting to Cheque Entries...");
        navigate('/book-section/cheque-record', { 
          state: { 
            empName: vendorName, 
            empNo: partyCode, 
            pensionNo: "",
            empStatus: "medical",
            totalAmount: grossAmount,
            remainingBalance: balanceAmount
          } 
        });
      }, 1500);
    } catch (err: any) {
      toast.error("Error saving medical record: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery) return toast.warning("Please enter a search query!");
    
    setIsSearching(true);
    try {
      const column = searchType === 'party' ? 'party_code' : 'voucher_no';
      const { data, error } = await supabase
        .from('medical_billings' as any)
        .select('*')
        .eq(column, searchQuery)
        .maybeSingle();

      if (error) throw error;
      
      const record = data as any;
      if (record) {
        setBudgetYear(record.budget_year || "");
        setBudgetHead(record.budget_head || "");
        setPmrVoucher(record.pmr_voucher || "");
        setVendorName(record.vendor_name || "");
        setHospitalName(record.hospital_name || "");
        setPartyCode(record.party_code || "");
        setVoucherNo(record.voucher_no || "");
        setChequeNo(record.cheque_no || "");
        setBalanceAmount(record.balance_amount?.toString() || "");
        setIncomeTax(record.income_tax?.toString() || "0");
        setGrossAmount(record.gross_amount?.toString() || "0");
        setBillPassedOn(record.bill_passed_on || "");
        setPaymentDate(record.payment_date || "");
        setVendorType(record.vendor_type || "medical");
        toast.success("Medical record found in database!");
      } else {
        toast.error("No medical record found.");
      }
    } catch (err: any) {
      toast.error("Search error: " + err.message);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Medical Billings</h1>
          <p className="text-sm text-muted-foreground">Process medical expense claims and vendor payments</p>
          {trackingId && (
            <div className="mt-2 flex items-center gap-2">
               <span className="text-[10px] font-bold bg-primary/20 text-primary px-2 py-0.5 rounded-md border border-primary/20">TRACKING: {trackingId}</span>
               <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 text-[10px] gap-1 hover:text-primary p-0"
                onClick={() => navigate('/book-section/file-tracking', { state: { bill: { tracking_id: trackingId, diary_no: voucherNo, party_name: vendorName } } })}
               >
                 <Search className="w-3 h-3" /> View Journey
                </Button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => handleReset()} className="gap-2">
            <RotateCcw className="w-4 h-4" /> Reset
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isSaving} className="gap-2">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Record
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Main form */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="glass-card overflow-hidden border-none">
            <div className="h-2 bg-primary" />
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Receipt className="w-5 h-5 text-primary" />
                Voucher & Institution Details
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div className="space-y-2">
                <Label htmlFor="budgetYear">Budget Year</Label>
                <Input id="budgetYear" type="date" value={budgetYear} onChange={(e) => setBudgetYear(e.target.value)} className="bg-muted/20 border-border/50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="budgetHead">Budget Head</Label>
                <Input id="budgetHead" value={budgetHead} onChange={(e) => setBudgetHead(e.target.value)} placeholder="Head Name" className="bg-muted/20 border-border/50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hospitalName">Hospital Name <span className="text-red-400">*</span></Label>
                <Input id="hospitalName" value={hospitalName} onChange={(e) => setHospitalName(e.target.value)} placeholder="Enter Hospital Name" className={`bg-muted/20 border-border/50${errors.hospitalName ? ' border-red-500' : ''}`} />
                {errors.hospitalName && <p className="text-xs text-red-400 mt-1">{errors.hospitalName}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="vendorName">Vendor Name <span className="text-red-400">*</span></Label>
                <Input 
                  id="vendorName" 
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  className={`bg-muted/20 border-border/50${errors.vendorName ? ' border-red-500' : ''}`}
                />
                {errors.vendorName && <p className="text-xs text-red-400 mt-1">{errors.vendorName}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="partyCode">Party's Code <span className="text-red-400">*</span></Label>
                <Input id="partyCode" value={partyCode} onChange={(e) => setPartyCode(e.target.value)} className={`bg-muted/20 border-border/50${errors.partyCode ? ' border-red-500' : ''}`} />
                {errors.partyCode && <p className="text-xs text-red-400 mt-1">{errors.partyCode}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="pmrVoucher">PMR Voucher</Label>
                <Input id="pmrVoucher" value={pmrVoucher} onChange={(e) => setPmrVoucher(e.target.value)} className="bg-muted/20 border-border/50 font-mono" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="voucherNo">Voucher No <span className="text-red-400">*</span></Label>
                <Input id="voucherNo" value={voucherNo} onChange={(e) => setVoucherNo(e.target.value)} className={`bg-muted/20 border-border/50${errors.voucherNo ? ' border-red-500' : ''}`} />
                {errors.voucherNo && <p className="text-xs text-red-400 mt-1">{errors.voucherNo}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="billPassedOn">Bill Passed On</Label>
                <Input id="billPassedOn" type="date" value={billPassedOn} onChange={(e) => setBillPassedOn(e.target.value)} className="bg-muted/20 border-border/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card overflow-hidden border-none">
            <div className="h-2 bg-green-500/50" />
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calculator className="w-5 h-5 text-green-400" />
                Billing Amounts
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="grossAmount">Gross Amount <span className="text-red-400">*</span></Label>
                <Input 
                  id="grossAmount" 
                  type="number" 
                  value={grossAmount}
                  onChange={(e) => setGrossAmount(e.target.value)}
                  className={`bg-muted/20 border-border/50 font-mono${errors.grossAmount ? ' border-red-500' : ''}`}
                />
                {errors.grossAmount && <p className="text-xs text-red-400 mt-1">{errors.grossAmount}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="incomeTax">Income Tax</Label>
                <Input id="incomeTax" type="number" value={incomeTax} onChange={(e) => setIncomeTax(e.target.value)} className="bg-muted/20 border-border/50 font-mono text-expense" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="netAmount">Net Amount</Label>
                <div className="h-10 w-full rounded-md border border-primary/50 bg-primary/10 flex items-center px-3 font-mono text-primary font-bold">
                  {netAmount.toLocaleString()}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card overflow-hidden border-none">
            <div className="h-2 bg-amber-500/50" />
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calculator className="w-5 h-5 text-amber-400" />
                Payment & Reconciliation
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div className="space-y-2">
                <Label htmlFor="chequeNo">Cheque No</Label>
                <Input id="chequeNo" value={chequeNo} onChange={(e) => setChequeNo(e.target.value)} className="bg-muted/20 border-border/50 font-mono" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentDate">Payment Date</Label>
                <Input id="paymentDate" type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} className="bg-muted/20 border-border/50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="balanceAmount">Balance Amount</Label>
                <Input id="balanceAmount" type="number" value={balanceAmount} onChange={(e) => setBalanceAmount(e.target.value)} className="bg-muted/20 border-border/50 font-mono" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column: Search & Global */}
        <div className="space-y-6">
          <Card className="glass-card overflow-hidden border-none p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 bg-black text-white px-3 py-2 rounded-md w-fit text-sm font-bold italic">
                <Stethoscope className="w-4 h-4" /> VENDOR IDENTIFICATION
              </div>
              <Select value={vendorType} onValueChange={setVendorType}>
                <SelectTrigger className="bg-muted/20 border-border/50">
                  <SelectValue placeholder="Identify Vendor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="medical">Medical</SelectItem>
                  <SelectItem value="contractor">Contractor</SelectItem>
                  <SelectItem value="security_deposit">Security Deposit</SelectItem>
                  <SelectItem value="contingencies">Contingencies</SelectItem>
                  <SelectItem value="pol_bills">POL Bills</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>

          <Card className="glass-card overflow-hidden border-none bg-primary/5">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-rose-500 italic">SEARCH FILTER</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Enter code or number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-background/50 border-border/50" 
                />
              </div>
              <RadioGroup 
                value={searchType} 
                onValueChange={setSearchType} 
                className="grid grid-cols-1 gap-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="party" id="party" className="border-primary" />
                  <Label htmlFor="party" className="text-xs italic text-muted-foreground font-bold">BY PARTY CODE</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="voucher" id="voucher" className="border-primary" />
                  <Label htmlFor="voucher" className="text-xs italic text-muted-foreground font-bold">BY VOUCHER NO</Label>
                </div>
              </RadioGroup>
              <Button 
                onClick={handleSearch} 
                disabled={isSearching}
                size="sm" 
                className="w-full bg-primary/20 hover:bg-primary/30 text-primary border border-primary/20"
              >
                {isSearching ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Search className="w-4 h-4 mr-2" />}
                Search Database
              </Button>
            </CardContent>
          </Card>

          {/* Scanned Bill Preview Section */}
          {scanUrl && (
            <Card className="glass-card overflow-hidden border-none bg-primary/5 group">
               <CardHeader className="py-3 border-b border-primary/10">
                  <CardTitle className="text-xs font-bold flex items-center gap-2 text-primary uppercase">
                    <FileImage className="w-4 h-4" /> Physical Scan Attachment
                  </CardTitle>
               </CardHeader>
               <CardContent className="p-0 relative overflow-hidden aspect-[3/4]">
                  <img src={scanUrl} alt="Bill Scan" className="w-full h-full object-contain bg-zinc-900" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                     <a href={scanUrl} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white shadow-xl scale-90 group-hover:scale-100 transition-transform">
                           <ExternalLink className="w-6 h-6" />
                        </div>
                        <span className="text-white text-xs font-bold uppercase tracking-widest">View Original</span>
                     </a>
                  </div>
               </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Records Table */}
      <Card className="glass-card overflow-hidden border-none shadow-md mt-6">
        <div className="h-2 bg-primary/50" />
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Receipt className="w-5 h-5 text-primary" />
            Recent Medical Records
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
                  <TableHead>Hospital</TableHead>
                  <TableHead>Gross Amount</TableHead>
                  <TableHead>Net Amount</TableHead>
                  <TableHead>Payment Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.length > 0 ? (
                  records.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.voucher_no}</TableCell>
                      <TableCell>{r.party_code}</TableCell>
                      <TableCell>{r.vendor_name}</TableCell>
                      <TableCell>{r.hospital_name}</TableCell>
                      <TableCell>{r.gross_amount}</TableCell>
                      <TableCell className="font-bold text-primary">{r.net_amount}</TableCell>
                      <TableCell>{r.payment_date || 'N/A'}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-10">No records found</TableCell>
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
