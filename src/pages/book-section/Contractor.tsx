import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Briefcase, FileText, Calculator, Search, Save, RotateCcw, ShieldCheck, Loader2, FileImage, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useVoice } from "@/contexts/VoiceContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function Contractor() {
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
  const [contractorName, setContractorName] = useState("");
  const [partyCode, setPartyCode] = useState("");
  const [cityTown, setCityTown] = useState("");
  const [voucherNo, setVoucherNo] = useState("");
  const [chequeNo, setChequeNo] = useState("");
  const [balanceAmount, setBalanceAmount] = useState("");
  
  const [waterCharges, setWaterCharges] = useState("0");
  const [securityDeposit, setSecurityDeposit] = useState("0");
  const [gstOther, setGstOther] = useState("0");
  const [incomeTax, setIncomeTax] = useState("0");
  
  const [grossAmount, setGrossAmount] = useState("0");
  const [billPassedOn, setBillPassedOn] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [workDescription, setWorkDescription] = useState("");
  const [vendorType, setVendorType] = useState("");
  const [scanUrl, setScanUrl] = useState<string | null>(null);
  const [trackingId, setTrackingId] = useState<string | null>(null);

  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState("party");
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Derived Values
  const totalDeductions = (parseFloat(waterCharges) || 0) + 
                          (parseFloat(securityDeposit) || 0) + 
                          (parseFloat(gstOther) || 0) + 
                          (parseFloat(incomeTax) || 0);
  const netAmount = (parseFloat(grossAmount) || 0) - totalDeductions;

  const fetchRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('contractor_billings' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
        
      if (error) throw error;
      if (data) setRecords(data);
    } catch (err) {
      console.error("Error fetching contractor records:", err);
    }
  };

  useEffect(() => {
    fetchRecords();

    // Check if data is coming from Bill Dispatch (navState)
    if (navState) {
        if (navState.contractorName) setContractorName(navState.contractorName);
        if (navState.grossAmount) setGrossAmount(navState.grossAmount.toString());
        if (navState.voucherNo) setVoucherNo(navState.voucherNo);
        if (navState.partyCode) setPartyCode(navState.partyCode);
        if (navState.workDescription) setWorkDescription(navState.workDescription);
        if (navState.scanUrl) setScanUrl(navState.scanUrl);
        if (navState.trackingId) setTrackingId(navState.trackingId);
        toast.success("Data & Scan imported from Bill Dispatch");
        // Clear history state
        window.history.replaceState({}, document.title);
    }

    if (openModal === 'contractor') {
      if (formData.name) setContractorName(formData.name);
      if (formData.amount) setGrossAmount(formData.amount.toString());
      if (formData.city) setCityTown(formData.city);
      if (formData.voucher) setVoucherNo(formData.voucher);
      setOpenModal(null);
    }
  }, [openModal, formData, setOpenModal, navState]);

  const handleReset = (silent = false) => {
    setBudgetYear("");
    setBudgetHead("");
    setPmrVoucher("");
    setContractorName("");
    setScanUrl(null);
    setPartyCode("");
    setCityTown("");
    setVoucherNo("");
    setChequeNo("");
    setBalanceAmount("");
    setWaterCharges("0");
    setSecurityDeposit("0");
    setGstOther("0");
    setIncomeTax("0");
    setGrossAmount("0");
    setBillPassedOn("");
    setPaymentDate("");
    setWorkDescription("");
    setVendorType("");
    setErrors({});
    if (!silent) toast.info("Form reset successfully.");
  };

  const handleSave = async () => {
    // Validation
    const newErrors: Record<string, string> = {};
    if (!contractorName.trim()) newErrors.contractorName = "Contractor Name is required";
    if (!partyCode.trim()) newErrors.partyCode = "Party Code is required";
    if (!voucherNo.trim()) newErrors.voucherNo = "Voucher No is required";
    if (!grossAmount || parseFloat(grossAmount) <= 0) newErrors.grossAmount = "Gross Amount must be greater than 0";
    if (!vendorType) newErrors.vendorType = "Please select Vendor Identification";
    if (!workDescription.trim()) newErrors.workDescription = "Work Description is required";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error(`${Object.keys(newErrors).length} required field(s) incomplete!`);
      return;
    }
    setErrors({});

    setIsSaving(true);
    try {
      const { error } = await supabase.from('contractor_billings' as any).insert({
        budget_year: budgetYear ? new Date(budgetYear).toISOString().split('T')[0] : null,
        budget_head: budgetHead,
        pmr_voucher: pmrVoucher,
        contractor_name: contractorName,
        party_code: partyCode,
        city_town: cityTown,
        voucher_no: voucherNo,
        cheque_no: chequeNo,
        balance_amount: parseFloat(balanceAmount) || 0,
        water_charges: parseFloat(waterCharges) || 0,
        security_deposit: parseFloat(securityDeposit) || 0,
        gst_other: parseFloat(gstOther) || 0,
        income_tax: parseFloat(incomeTax) || 0,
        gross_amount: parseFloat(grossAmount) || 0,
        net_amount: netAmount,
        bill_passed_on: billPassedOn || null,
        payment_date: paymentDate || null,
        work_description: workDescription,
        vendor_type: vendorType
      });

      if (error) throw error;
      toast.success("Contractor record saved successfully!");
      await fetchRecords(); // Refresh the grid
      handleReset(true);
      setTimeout(() => {
        toast.info("Redirecting to Cheque Entries...");
        navigate('/book-section/cheque-record', { 
          state: { 
            empName: contractorName, 
            empNo: partyCode, 
            pensionNo: "",
            empStatus: "contractor",
            totalAmount: grossAmount,
            remainingBalance: balanceAmount
          } 
        });
      }, 1500);
    } catch (err: any) {
      toast.error("Error saving contractor record: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery) return toast.warning("Please enter something to search!");
    
    setIsSearching(true);
    try {
      const column = searchType === 'party' ? 'party_code' : 'voucher_no';
      const { data, error } = await supabase
        .from('contractor_billings' as any)
        .select('*')
        .eq(column, searchQuery)
        .maybeSingle();

      if (error) throw error;
      
      const record = data as any;
      if (record) {
        setBudgetYear(record.budget_year || "");
        setBudgetHead(record.budget_head || "");
        setPmrVoucher(record.pmr_voucher || "");
        setContractorName(record.contractor_name || "");
        setPartyCode(record.party_code || "");
        setCityTown(record.city_town || "");
        setVoucherNo(record.voucher_no || "");
        setChequeNo(record.cheque_no || "");
        setBalanceAmount(record.balance_amount?.toString() || "");
        setWaterCharges(record.water_charges?.toString() || "0");
        setSecurityDeposit(record.security_deposit?.toString() || "0");
        setGstOther(record.gst_other?.toString() || "0");
        setIncomeTax(record.income_tax?.toString() || "0");
        setGrossAmount(record.gross_amount?.toString() || "0");
        setBillPassedOn(record.bill_passed_on || "");
        setPaymentDate(record.payment_date || "");
        setWorkDescription(record.work_description || "");
        setVendorType(record.vendor_type || "");
        toast.success("Contractor record found!");
      } else {
        toast.error("No contractor record found.");
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
          <h1 className="text-2xl font-bold italic tracking-tight text-white/90">Contractor Billings</h1>
          <p className="text-sm text-muted-foreground italic">Manage financial records for service and construction contractors</p>
          {trackingId && (
            <div className="mt-2 flex items-center gap-2">
               <span className="text-[10px] font-bold bg-primary/20 text-primary px-2 py-0.5 rounded-md border border-primary/20">TRACKING: {trackingId}</span>
               <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 text-[10px] gap-1 hover:text-primary p-0 text-muted-foreground"
                onClick={() => navigate('/book-section/file-tracking', { state: { bill: { tracking_id: trackingId, diary_no: voucherNo, party_name: contractorName } } })}
               >
                 <Search className="w-3 h-3" /> View Journey
                </Button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => handleReset()} className="gap-2 border-primary/20 hover:bg-primary/5">
            <RotateCcw className="w-4 h-4" /> Reset
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isSaving} className="gap-2 bg-primary hover:bg-primary/90 font-bold">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} 
            Save Record
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <Card className="glass-card overflow-hidden border-none shadow-2xl bg-white/5 backdrop-blur-md">
            <div className="h-1 bg-gradient-to-r from-primary via-indigo-500 to-primary" />
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2 font-bold italic text-white/80">
                <FileText className="w-5 h-5 text-primary" />
                Contract & Budget Info
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
              <div className="space-y-2">
                <Label htmlFor="budgetYear" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Budget Year</Label>
                <Input id="budgetYear" type="date" value={budgetYear} onChange={(e) => setBudgetYear(e.target.value)} className="bg-white/5 border-white/10 text-white" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="budgetHead" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Budget Head</Label>
                <Input id="budgetHead" value={budgetHead} onChange={(e) => setBudgetHead(e.target.value)} className="bg-white/5 border-white/10 text-white" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pmrVoucher" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">PMR Voucher</Label>
                <Input id="pmrVoucher" value={pmrVoucher} onChange={(e) => setPmrVoucher(e.target.value)} className="bg-white/5 border-white/10 text-white font-mono" />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="contractorName" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Contractor Name <span className="text-red-400">*</span></Label>
                <Input
                  id="contractorName"
                  value={contractorName}
                  onChange={(e) => setContractorName(e.target.value)}
                  className={`bg-white/5 border-white/10 text-white${errors.contractorName ? ' border-red-500' : ''}`}
                />
                {errors.contractorName && <p className="text-xs text-red-400 mt-1">{errors.contractorName}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="partyCode" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">PartyCode <span className="text-red-400">*</span></Label>
                <Input id="partyCode" value={partyCode} onChange={(e) => setPartyCode(e.target.value)} className={`bg-white/5 border-white/10 text-white font-mono${errors.partyCode ? ' border-red-500' : ''}`} />
                {errors.partyCode && <p className="text-xs text-red-400 mt-1">{errors.partyCode}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cityTown" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">City / Town</Label>
                <Input id="cityTown" value={cityTown} onChange={(e) => setCityTown(e.target.value)} className="bg-white/5 border-white/10 text-white" placeholder="Enter City/Town" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="voucherNo" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Voucher No <span className="text-red-400">*</span></Label>
                <Input id="voucherNo" value={voucherNo} onChange={(e) => setVoucherNo(e.target.value)} className={`bg-white/5 border-white/10 text-white font-mono${errors.voucherNo ? ' border-red-500' : ''}`} />
                {errors.voucherNo && <p className="text-xs text-red-400 mt-1">{errors.voucherNo}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="chequeNo" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Cheque Number</Label>
                <Input id="chequeNo" value={chequeNo} onChange={(e) => setChequeNo(e.target.value)} className="bg-white/5 border-white/10 text-white font-mono" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="balanceAmount" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Remaining Amount</Label>
                <Input id="balanceAmount" type="number" value={balanceAmount} onChange={(e) => setBalanceAmount(e.target.value)} className="bg-white/5 border-white/10 text-white font-mono text-indigo-300" />
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="glass-card overflow-hidden border-none bg-white/5">
              <div className="h-1 bg-rose-500/50" />
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2 font-bold italic text-rose-300">
                  <Calculator className="w-5 h-5 text-rose-400" />
                  Deductions
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4 pt-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">Water Charges</Label>
                  <Input type="number" value={waterCharges} onChange={(e) => setWaterCharges(e.target.value)} className="bg-white/5 border-white/10 text-white font-mono text-sm" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">Security Deposit</Label>
                  <Input type="number" value={securityDeposit} onChange={(e) => setSecurityDeposit(e.target.value)} className="bg-white/5 border-white/10 text-white font-mono text-sm" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">GST/Other</Label>
                  <Input type="number" value={gstOther} onChange={(e) => setGstOther(e.target.value)} className="bg-white/5 border-white/10 text-white font-mono text-sm" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">Income Tax</Label>
                  <Input type="number" value={incomeTax} onChange={(e) => setIncomeTax(e.target.value)} className="bg-white/5 border-white/10 text-white font-mono text-sm" />
                </div>
                <div className="col-span-2 pt-2 border-t border-rose-500/10 flex justify-between items-center px-1">
                  <span className="text-[10px] font-bold text-rose-400 uppercase italic">Total Deductions</span>
                  <span className="text-sm font-bold font-mono text-rose-400">{totalDeductions.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card overflow-hidden border-none bg-white/5">
              <div className="h-1 bg-emerald-500/50" />
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2 font-bold italic text-emerald-300">
                  <Calculator className="w-5 h-5 text-emerald-400" />
                  Amounts & Payments
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4 pt-4">
                <div className="space-y-2 overflow-hidden">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">Total Amount <span className="text-red-400">*</span></Label>
                  <Input
                    type="number"
                    value={grossAmount}
                    onChange={(e) => setGrossAmount(e.target.value)}
                    className={`bg-white/5 border-white/10 text-white font-mono text-sm${errors.grossAmount ? ' border-red-500' : ''}`}
                  />
                  {errors.grossAmount && <p className="text-xs text-red-400 mt-1">{errors.grossAmount}</p>}
                </div>
                <div className="space-y-2 overflow-hidden">
                  <Label className="text-[10px] font-bold uppercase text-emerald-400/80">Net Amount</Label>
                  <div className="h-9 w-full rounded-md border border-emerald-500/30 bg-emerald-500/10 flex items-center px-3 font-mono text-emerald-400 font-bold text-sm">
                    {netAmount.toLocaleString()}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">Bill Passed On</Label>
                  <Input type="date" value={billPassedOn} onChange={(e) => setBillPassedOn(e.target.value)} className="bg-white/5 border-white/10 text-white text-xs h-9" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">Payment Date</Label>
                  <Input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} className="bg-white/5 border-white/10 text-white text-xs h-9" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="glass-card overflow-hidden border-none bg-white/5">
            <div className="h-1 bg-indigo-500/50" />
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                 <Briefcase className="w-5 h-5 text-indigo-400" />
                 <span className="font-bold italic text-indigo-300">Work Description</span>
              </div>
              <Textarea 
                placeholder="Enter detailed work name or description..." 
                value={workDescription}
                onChange={(e) => setWorkDescription(e.target.value)}
                className={`min-h-[100px] bg-white/5 border-white/10 text-white placeholder:text-muted-foreground/30 ring-0 focus-visible:ring-1 focus-visible:ring-indigo-500/50${errors.workDescription ? ' border-red-500' : ''}`}
              />
              {errors.workDescription && <p className="text-xs text-red-400 mt-1">{errors.workDescription}</p>}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="glass-card overflow-hidden border-none p-6 bg-white/5">
            <div className="space-y-4">
              <div className="flex items-center gap-2 bg-primary/20 text-primary px-3 py-1.5 rounded-md w-fit text-xs font-black tracking-widest uppercase italic border border-primary/20">
                <ShieldCheck className="w-3.5 h-3.5" /> VENDOR TYPE
              </div>
              <Select value={vendorType} onValueChange={setVendorType}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Identify Vendor" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-white/10 text-white">
                  <SelectItem value="medical">Medical</SelectItem>
                  <SelectItem value="contractor">Contractor</SelectItem>
                  <SelectItem value="security_deposit">Security Deposit</SelectItem>
                  <SelectItem value="contingencies">Contingencies</SelectItem>
                  <SelectItem value="pol_bills">POL Bills</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>

          <Card className="glass-card overflow-hidden border-none shadow-inner bg-gradient-to-b from-primary/10 to-transparent border-t border-primary/10">
            <CardHeader>
              <CardTitle className="text-xs font-black text-primary/80 tracking-[0.2em] italic uppercase">SEARCH PERSPECTIVE</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                 <Input 
                   placeholder={`Enter ${searchType === 'party' ? 'Party Code' : 'Voucher No'}...`}
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   className="bg-black/40 border-primary/20 text-white placeholder:text-muted-foreground/40 font-mono text-xs" 
                 />
              </div>
              <RadioGroup value={searchType} onValueChange={setSearchType} className="grid grid-cols-2 gap-2">
                <div className="flex items-center space-x-2 bg-white/5 p-2 rounded-md border border-white/5 cursor-pointer hover:bg-white/10 transition-colors">
                  <RadioGroupItem value="party" id="cp" className="border-primary text-primary" />
                  <Label htmlFor="cp" className="text-[9px] font-black text-muted-foreground uppercase cursor-pointer">By Party</Label>
                </div>
                <div className="flex items-center space-x-2 bg-white/5 p-2 rounded-md border border-white/5 cursor-pointer hover:bg-white/10 transition-colors">
                  <RadioGroupItem value="voucher" id="cv" className="border-primary text-primary" />
                  <Label htmlFor="cv" className="text-[9px] font-black text-muted-foreground uppercase cursor-pointer">By Voucher</Label>
                </div>
              </RadioGroup>
              <Button 
                onClick={handleSearch} 
                className="w-full bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 font-black uppercase text-[10px] tracking-[0.3em] h-10 shadow-lg"
              >
                {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5 mr-2" />} Execute
              </Button>
            </CardContent>
          </Card>

          {/* Scanned Bill Preview Section */}
          {scanUrl && (
            <Card className="glass-card overflow-hidden border-none bg-primary/5 group shadow-inner">
               <CardHeader className="py-2.5 border-b border-primary/10">
                  <CardTitle className="text-[10px] font-black tracking-widest flex items-center gap-2 text-primary uppercase italic">
                    <FileImage className="w-3.5 h-3.5" /> Digitzed Document Preview
                  </CardTitle>
               </CardHeader>
               <CardContent className="p-0 relative overflow-hidden aspect-[3/4]">
                  <img src={scanUrl} alt="Bill Scan" className="w-full h-full object-contain bg-zinc-950" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                     <a href={scanUrl} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white shadow-xl scale-90 group-hover:scale-100 transition-transform">
                           <ExternalLink className="w-5 h-5" />
                        </div>
                        <span className="text-white text-[10px] font-black uppercase tracking-[0.2em]">Launch Viewer</span>
                     </a>
                  </div>
               </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Records Table */}
      <Card className="glass-card overflow-hidden border-none shadow-md mt-6">
        <div className="h-2 bg-indigo-500/50" />
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            Recent Contractor Records
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border/50 overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Voucher No</TableHead>
                  <TableHead>Party Code</TableHead>
                  <TableHead>Contractor Name</TableHead>
                  <TableHead>City/Town</TableHead>
                  <TableHead>Gross Amount</TableHead>
                  <TableHead>Net Amount</TableHead>
                  <TableHead>Work Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.length > 0 ? (
                  records.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium font-mono">{r.voucher_no}</TableCell>
                      <TableCell className="font-mono text-xs">{r.party_code}</TableCell>
                      <TableCell className="font-semibold">{r.contractor_name}</TableCell>
                      <TableCell>{r.city_town}</TableCell>
                      <TableCell className="font-mono text-xs italic">{r.gross_amount}</TableCell>
                      <TableCell className="font-mono font-bold text-indigo-400">{r.net_amount}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{r.work_description}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-10 italic">No records found. Save a record to see it here.</TableCell>
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

