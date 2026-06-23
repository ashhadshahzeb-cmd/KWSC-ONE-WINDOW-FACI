import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AlertCircle, FileText, Calculator, Search, Save, RotateCcw, Trash2, ShieldCheck, Receipt, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function Contingencies() {
  const navigate = useNavigate();
  const location = useLocation();
  const navState = location.state as any;

  // Records State
  const [records, setRecords] = useState<any[]>([]);

  // Form States
  const [serialNo, setSerialNo] = useState("");
  const [budgetYear, setBudgetYear] = useState("");
  const [partyCode, setPartyCode] = useState("");
  const [vendorName, setVendorName] = useState("");
  const [voucherNo, setVoucherNo] = useState("");
  const [description, setDescription] = useState("");
  const [grossAmount, setGrossAmount] = useState("0");
  const [incomeTax, setIncomeTax] = useState("0");
  const [netAmount, setNetAmount] = useState("0");
  const [chequeNo, setChequeNo] = useState("");
  const [balanceAmount, setBalanceAmount] = useState("0");

  const fetchRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('contingency_billings' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      if (data) setRecords(data);
    } catch (err) {
      console.error("Error fetching contingency records:", err);
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
      if (navState.workDescription) setDescription(navState.workDescription);
      toast.success("Data imported from Bill Dispatch");
      // Clear history state
      window.history.replaceState({}, document.title);
    }
  }, [navState]);

  const [vendorType, setVendorType] = useState("contingencies");

  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState("party");
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleReset = (silent = false) => {
    setSerialNo("");
    setBudgetYear("");
    setPartyCode("");
    setVendorName("");
    setVoucherNo("");
    setDescription("");
    setGrossAmount("0");
    setIncomeTax("0");
    setNetAmount("0");
    setChequeNo("");
    setBalanceAmount("0");
    setVendorType("contingencies");
    setErrors({});
    if (!silent) toast.info("Form reset successfully.");
  };

  const handleSave = async () => {
    const newErrors: Record<string, string> = {};
    if (!vendorName.trim()) newErrors.vendorName = "Vendor Name is required";
    if (!partyCode.trim()) newErrors.partyCode = "Party Code is required";
    if (!voucherNo.trim()) newErrors.voucherNo = "Voucher No is required";
    if (!description.trim()) newErrors.description = "Description is required";
    if (!grossAmount || parseFloat(grossAmount) <= 0) newErrors.grossAmount = "Gross Amount must be greater than 0";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error(`${Object.keys(newErrors).length} required field(s) incomplete!`);
      return;
    }
    setErrors({});

    setIsSaving(true);
    try {
      const { error } = await supabase.from('contingency_billings' as any).insert({
        serial_no: serialNo,
        budget_year: budgetYear,
        party_code: partyCode,
        vendor_name: vendorName,
        voucher_no: voucherNo,
        work_description: description,
        gross_amount: parseFloat(grossAmount) || 0,
        income_tax: parseFloat(incomeTax) || 0,
        net_amount: parseFloat(netAmount) || 0,
        cheque_no: chequeNo,
        balance_amount: parseFloat(balanceAmount) || 0,
        vendor_type: vendorType
      });

      if (error) throw error;
      toast.success("Contingency record saved successfully!");
      await fetchRecords(); // Refresh the grid
      handleReset(true);
      setTimeout(() => {
        toast.info("Redirecting to Cheque Entries...");
        navigate('/book-section/cheque-record', {
          state: {
            empName: vendorName,
            empNo: partyCode,
            pensionNo: "",
            empStatus: "contingencies",
            totalAmount: grossAmount,
            remainingBalance: balanceAmount
          }
        });
      }, 1500);
    } catch (err: any) {
      toast.error("Error saving contingency: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery) return toast.warning("Enter search query!");
    setIsSearching(true);
    try {
      const column = searchType === 'party' ? 'party_code' : 'voucher_no';
      const { data, error } = await supabase
        .from('contingency_billings' as any)
        .select('*')
        .eq(column, searchQuery)
        .maybeSingle();

      if (error) throw error;

      const record = data as any;
      if (record) {
        setSerialNo(record.serial_no || "");
        setBudgetYear(record.budget_year || "");
        setPartyCode(record.party_code || "");
        setVendorName(record.vendor_name || "");
        setVoucherNo(record.voucher_no || "");
        setDescription(record.work_description || "");
        setGrossAmount(record.gross_amount?.toString() || "0");
        setIncomeTax(record.income_tax?.toString() || "0");
        setNetAmount(record.net_amount?.toString() || "0");
        setChequeNo(record.cheque_no || "");
        setBalanceAmount(record.balance_amount?.toString() || "0");
        toast.success("Contingency record found!");
      } else {
        toast.error("No contingency record found.");
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
          <h1 className="text-2xl font-bold">Contingency Expenses</h1>
          <p className="text-sm text-muted-foreground">Process miscellaneous and unforeseen operational expenditures</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="glass-card overflow-hidden border-none shadow-lg">
            <div className="h-2 bg-primary" />
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Receipt className="w-5 h-5 text-primary" />
                Voucher & Identification
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="serialNo">Serial No</Label>
                <Input id="serialNo" value={serialNo} onChange={(e) => setSerialNo(e.target.value)} placeholder="Enter Serial" className="bg-muted/20 border-border/50 text-xs font-mono h-9" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="budgetYear">Budget Year</Label>
                <Input id="budgetYear" value={budgetYear} onChange={(e) => setBudgetYear(e.target.value)} placeholder="2024-25" className="bg-muted/20 border-border/50 h-9" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="partyCode">Party's Code <span className="text-red-400">*</span></Label>
                <Input id="partyCode" value={partyCode} onChange={(e) => setPartyCode(e.target.value)} className={`bg-muted/20 border-border/50 font-mono h-9${errors.partyCode ? ' border-red-500' : ''}`} />
                {errors.partyCode && <p className="text-xs text-red-400 mt-1">{errors.partyCode}</p>}
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="vendorName">Vendor Name <span className="text-red-400">*</span></Label>
                <Input id="vendorName" value={vendorName} onChange={(e) => setVendorName(e.target.value)} className={`bg-muted/20 border-border/50 h-9${errors.vendorName ? ' border-red-500' : ''}`} />
                {errors.vendorName && <p className="text-xs text-red-400 mt-1">{errors.vendorName}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="voucherNo">Voucher No <span className="text-red-400">*</span></Label>
                <Input id="voucherNo" value={voucherNo} onChange={(e) => setVoucherNo(e.target.value)} className={`bg-muted/20 border-border/50 h-9 font-mono${errors.voucherNo ? ' border-red-500' : ''}`} />
                {errors.voucherNo && <p className="text-xs text-red-400 mt-1">{errors.voucherNo}</p>}
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card overflow-hidden border-none shadow-md">
            <div className="h-2 bg-indigo-500/50" />
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-indigo-400" />
                Expense Description
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detail the specific item or service purchased..." className={`min-h-[140px] bg-muted/20 border-border/50 focus:border-indigo-500/30${errors.description ? ' border-red-500' : ''}`} />
              {errors.description && <p className="text-xs text-red-400 mt-1">{errors.description}</p>}
            </CardContent>
          </Card>

          <Card className="glass-card overflow-hidden border-none shadow-md">
            <div className="h-2 bg-emerald-500/50" />
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calculator className="w-5 h-5 text-emerald-400" />
                Financial Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Gross Amount <span className="text-red-400">*</span></Label>
                <Input type="number" value={grossAmount} onChange={(e) => setGrossAmount(e.target.value)} className={`bg-muted/20 border-border/50 font-mono${errors.grossAmount ? ' border-red-500' : ''}`} />
                {errors.grossAmount && <p className="text-xs text-red-400 mt-1">{errors.grossAmount}</p>}
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground font-semibold text-rose-400">Income Tax</Label>
                <Input type="number" value={incomeTax} onChange={(e) => setIncomeTax(e.target.value)} className="bg-rose-500/5 border-rose-500/20 font-mono text-rose-400" />
              </div>
              <div className="space-y-2 font-bold text-primary">
                <Label className="text-xs">Net Amount</Label>
                <Input type="number" value={netAmount} onChange={(e) => setNetAmount(e.target.value)} className="bg-primary/10 border-primary/30 font-mono" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Sidebar */}
        <div className="space-y-6">
          <Card className="glass-card overflow-hidden border-none p-6 space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] bg-black text-white px-3 py-1.5 rounded-sm w-fit font-bold italic tracking-widest">IDENT VENDOR</Label>
              <Select value={vendorType} onValueChange={setVendorType}>
                <SelectTrigger className="bg-muted/20 border-border/50 h-10">
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

            <div className="space-y-2">
              <Label className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Cheque Statistics</Label>
              <div className="space-y-3 p-3 bg-muted/20 rounded-md border border-border/50">
                <div className="space-y-1">
                  <Label className="text-[9px] text-muted-foreground">Cheque Number</Label>
                  <Input value={chequeNo} onChange={(e) => setChequeNo(e.target.value)} className="h-8 bg-background border-none text-xs font-mono" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] text-muted-foreground">Balance Amount</Label>
                  <Input value={balanceAmount} onChange={(e) => setBalanceAmount(e.target.value)} className="h-8 bg-background border-none text-xs font-mono" />
                </div>
              </div>
            </div>

            <Button variant="destructive" size="sm" className="w-full gap-2 text-xs h-10">
              <Trash2 className="w-3.5 h-3.5" /> DELETE ENTRY
            </Button>
          </Card>

          <Card className="glass-card overflow-hidden border-none bg-primary/5 p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-primary" />
              <Label className="text-xs font-bold text-rose-500 italic">SYSTEM LOOKUP</Label>
            </div>
            <Input
              placeholder="Enter reference..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-background/50 border-border/50 text-xs h-9"
            />
            <RadioGroup value={searchType} onValueChange={setSearchType} className="space-y-2">
              <div className="flex items-center gap-2">
                <RadioGroupItem value="party" id="cont-party" className="border-primary" />
                <Label htmlFor="cont-party" className="text-[10px] font-bold italic text-muted-foreground">BY PARTY CODE</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="voucher" id="cont-voucher" className="border-primary" />
                <Label htmlFor="cont-voucher" className="text-[10px] font-bold italic text-muted-foreground">BY VOUCHER NO</Label>
              </div>
            </RadioGroup>
            <Button
              onClick={handleSearch}
              disabled={isSearching}
              variant="outline"
              className="w-full h-8 text-[10px] font-bold border-primary/20 text-primary hover:bg-primary/10"
            >
              {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : <Search className="w-3.5 h-3.5 mr-2" />}
              PERFORM SEARCH
            </Button>
          </Card>
        </div>
      </div>

      {/* Records Table */}
      <Card className="glass-card overflow-hidden border-none shadow-md mt-6">
        <div className="h-2 bg-primary/50" />
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Receipt className="w-5 h-5 text-primary" />
            Recent Contingency Records
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
                  <TableHead>Description</TableHead>
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
                      <TableCell className="max-w-[250px] truncate">{r.work_description}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-10 italic">No records found.</TableCell>
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
