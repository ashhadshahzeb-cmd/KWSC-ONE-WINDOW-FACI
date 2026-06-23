import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { CreditCard, Printer, Save, RotateCcw, LayoutGrid, Calculator, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function ChequeRecord() {
  const location = useLocation();
  const navState = location.state as any;

  const [formData, setFormData] = useState({
    empName: navState?.empName || "",
    empNo: navState?.empNo || "",
    pensionNo: navState?.pensionNo || "",
    serialNo: "Auto-Gen",
    empStatus: navState?.empStatus || "regular",
    subcategory: navState?.subcategory || "",
    totalAmount: navState?.totalAmount || "0",
    remainingAmount: navState?.remainingBalance || "0",
    disbursedOn: "",
    recordStatus: "active",
  });

  const regularSubcategories = [
    "Cp Fund",
    "Funds",
    "Supp Salary",
    "House Building",
    "Marriage/Bike",
    "Medical Case",
    "Over Time",
    "TADA"
  ];

  const retiredSubcategories = [
    "Fund",
    "Funds",
    "LPR",
    "Pension/Gratuity",
    "Pension Arrear",
    "Financial Assist",
    "Funeral Charges",
    "Group Insurance"
  ];
  const [cheques, setCheques] = useState([{ chequeNo: "", amount: "", date: "", order: "1st" }]);

  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [startCheque, setStartCheque] = useState("");
  const [endCheque, setEndCheque] = useState("");

  const handlePrint = () => {
    if (!startCheque || !endCheque) {
      toast.error('Both fields are required for report generation');
      return;
    }
    setPrintDialogOpen(false);
    toast.success(`Crystal Report generated for cheques ${startCheque} to ${endCheque}`);
    setStartCheque("");
    setEndCheque("");
  };

  const [records, setRecords] = useState<any[]>([]);

  const fetchRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('cheque_records' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
        
      if (error) throw error;
      if (data) setRecords(data);
    } catch (err) {
      console.error("Error fetching cheque records:", err);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSave = async () => {
    const newErrors: Record<string, string> = {};
    if (!formData.empName.trim()) newErrors.empName = "Employee Name is required";
    if (!formData.empNo.trim()) newErrors.empNo = "Employee No is required";
    if (!formData.totalAmount || parseFloat(formData.totalAmount) <= 0) newErrors.totalAmount = "Total Amount must be greater than 0";
    if (!formData.disbursedOn) newErrors.disbursedOn = "Disbursed Date is required";
    const hasAtLeastOneCheque = cheques.some(c => c.chequeNo.trim() !== "");
    if (!hasAtLeastOneCheque) newErrors.chequeNo = "At least one Cheque No is required";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error(`${Object.keys(newErrors).length} required field(s) incomplete!`);
      return;
    }
    setErrors({});

    setIsSaving(true);
    try {
      const dbPayload = {
        emp_name: formData.empName,
        emp_no: formData.empNo || null,
        pension_no: formData.pensionNo || null,
        serial_no: formData.serialNo !== 'Auto-Gen' ? formData.serialNo : null,
        emp_status: formData.empStatus,
        total_amount: parseFloat(formData.totalAmount) || 0,
        remaining_amount: parseFloat(formData.remainingAmount) || 0,
        disbursed_on: formData.disbursedOn || null,
        record_status: formData.recordStatus,
        cheque_no_1: cheques[0]?.chequeNo || null,
        amount_1: parseFloat(cheques[0]?.amount) || 0,
        cheque_no_2: cheques[1]?.chequeNo || null,
        amount_2: parseFloat(cheques[1]?.amount) || 0,
        cheque_no_3: cheques[2]?.chequeNo || null,
        amount_3: parseFloat(cheques[2]?.amount) || 0,
        cheque_no_4: cheques[3]?.chequeNo || null,
        amount_4: parseFloat(cheques[3]?.amount) || 0,
        total_disbursed: parseFloat(calculateTotal()),
      };

      const { error } = await (supabase.from('cheque_records' as any).insert(dbPayload) as any);

      if (error) throw error;
      
      toast.success('Cheque entries saved successfully!');
      handleReset();
      fetchRecords(); // Refresh the grid
    } catch (err: any) {
      toast.error('Failed to save record: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleFetchEmployee = async (e: React.KeyboardEvent<HTMLInputElement>, isPension = false) => {
    const searchValue = isPension ? formData.pensionNo : formData.empNo;
    if (e.key === 'Enter' && searchValue) {
      toast.info(`Searching database...`);
      try {
        let tableName = 'book_section_employees';
        let idColumn = isPension ? 'pension_no' : 'employee_no';
        
        switch(formData.empStatus) {
            case 'medical': tableName = 'medical_billings'; idColumn = 'party_code'; break;
            case 'contractor': tableName = 'contractor_billings'; idColumn = 'party_code'; break;
            case 'security_deposit': tableName = 'security_deposits'; idColumn = 'party_code'; break;
            case 'pol_bills': tableName = 'pol_billings'; idColumn = 'emp_no'; break;
            case 'contingencies': tableName = 'contingency_billings'; idColumn = 'party_code'; break;
        }

        const { data, error } = await (supabase.from(tableName as any).select('*') as any)
          .eq(idColumn, searchValue)
          .maybeSingle();

        if (data) {
          const record = data as any;
          
          if (formData.empStatus === 'regular' || formData.empStatus === 'retired') {
              setFormData({
                ...formData,
                empNo: record.employee_no || formData.empNo,
                empName: record.full_name || "",
                pensionNo: record.pension_no || "",
                empStatus: record.category?.toLowerCase() === 'retired' ? 'retired' : 'regular',
                subcategory: record.sub_category_regular || record.sub_category_retired || "",
                totalAmount: record.total_amount?.toString() || "0",
                remainingAmount: record.balance_amount?.toString() || "0",
              });
          } else if (formData.empStatus === 'pol_bills') {
              setFormData({
                ...formData,
                empName: record.officer_name || "",
                totalAmount: record.gross_amount?.toString() || "0",
                remainingAmount: "0",
              });
          } else {
              setFormData({
                ...formData,
                empName: record.vendor_name || record.contractor_name || "",
                totalAmount: record.gross_amount?.toString() || "0",
                remainingAmount: record.balance_amount?.toString() || "0",
              });
          }

          toast.success('Record data retrieved successfully!');
        } else {
          toast.error('Record not found in database.');
        }
      } catch (err) {
        console.error("Fetch error:", err);
        toast.error('Search failed');
      }
    }
  };

  const handleReset = () => {
    setFormData({
      empName: "", empNo: "", pensionNo: "", serialNo: "Auto-Gen", empStatus: "regular", subcategory: "", totalAmount: "0", remainingAmount: "0",
      disbursedOn: "", recordStatus: "active",
    });
    setCheques([{ chequeNo: "", amount: "", date: "", order: "1st" }]);
    setErrors({});
    toast.info('Form cleared');
  };

  const calculateTotal = () => {
    const sum = cheques.reduce((acc, c) => {
      const num = parseFloat(c.amount);
      return acc + (isNaN(num) ? 0 : num);
    }, 0);
    return sum.toFixed(2);
  };

  const addChequeRow = () => {
    const orders = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th"];
    const nextOrder = orders[cheques.length] || `${cheques.length + 1}th`;
    setCheques([...cheques, { chequeNo: "", amount: "", date: "", order: nextOrder }]);
  };

  const updateCheque = (index: number, field: string, value: string) => {
    const updated = [...cheques];
    updated[index] = { ...updated[index], [field]: value };
    setCheques(updated);
  };

  const removeCheque = (index: number) => {
    if (cheques.length > 1) {
      setCheques(cheques.filter((_, i) => i !== index));
    }
  };
  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading">Cheque Records ({formData.empStatus.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())})</h1>
          <p className="text-sm text-muted-foreground font-sans">Manage multiple cheques assignment for employees</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2 font-sans" onClick={handleReset}>
            <RotateCcw className="w-4 h-4" /> Reset
          </Button>

          <Dialog open={printDialogOpen} onOpenChange={setPrintDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="secondary" size="sm" className="gap-2 font-sans">
                <Printer className="w-4 h-4" /> Print Specific Report
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Generate Cheque Report</DialogTitle>
                <DialogDescription>
                  Enter the starting and ending cheque numbers to view the report.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="start" className="text-right text-xs">Starting No</Label>
                  <Input id="start" className="col-span-3 font-mono" value={startCheque} onChange={e => setStartCheque(e.target.value)} />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="end" className="text-right text-xs">Ending No</Label>
                  <Input id="end" className="col-span-3 font-mono" value={endCheque} onChange={e => setEndCheque(e.target.value)} />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" onClick={handlePrint}>Generate Report</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button size="sm" className="gap-2 bg-primary hover:bg-primary/90 font-sans" onClick={handleSave} disabled={isSaving}>
            <Save className="w-4 h-4" /> {isSaving ? "Saving..." : "Finalize Payments"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Column */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="glass-card overflow-hidden border-none shadow-lg">
            <div className="h-2 bg-primary" />
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 font-heading">
                <LayoutGrid className="w-5 h-5 text-primary" />
                Employee Profile Mapping
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label className="text-xs font-bold font-sans">Category</Label>
                <Select 
                  value={formData.empStatus} 
                  onValueChange={v => setFormData({...formData, empStatus: v, subcategory: ""})}
                >
                  <SelectTrigger className="bg-muted/20 border-border/50 h-10 font-sans">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">Employee</SelectItem>
                    <SelectItem value="regular">Regular Employee</SelectItem>
                    <SelectItem value="retired">Retired Employee</SelectItem>
                    <SelectItem value="medical">Medical</SelectItem>
                    <SelectItem value="contractor">Contractor</SelectItem>
                    <SelectItem value="security_deposit">Security Deposit</SelectItem>
                    <SelectItem value="pol_bills">POL Bills</SelectItem>
                    <SelectItem value="contingencies">Contingencies</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold font-sans">Subcategory</Label>
                <Select 
                  value={formData.subcategory} 
                  onValueChange={v => setFormData({...formData, subcategory: v})}
                >
                  <SelectTrigger className="bg-muted/20 border-border/50 h-10 font-sans">
                    <SelectValue placeholder="Select Subcategory" />
                  </SelectTrigger>
                  <SelectContent>
                    {(formData.empStatus === "regular" || formData.empStatus === "employee" ? regularSubcategories : retiredSubcategories).map(sub => (
                      <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold font-sans">Employee No <span className="text-red-400">*</span></Label>
                <Input 
                  placeholder="EMP-XXXX" 
                  className={`bg-muted/20 border-border/50 h-10 font-sans${errors.empNo ? ' border-red-500' : ''}`}
                  value={formData.empNo} 
                  onChange={e => setFormData({...formData, empNo: e.target.value})}
                  onKeyDown={handleFetchEmployee}
                />
                {errors.empNo && <p className="text-xs text-red-400 mt-1">{errors.empNo}</p>}
              </div>
              {formData.empStatus === "retired" && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                  <Label className="text-xs font-bold font-sans">Pension No</Label>
                  <Input 
                    placeholder="PEN-XXXX" 
                    className="bg-muted/20 border-border/50 h-10 font-sans"
                    value={formData.pensionNo} 
                    onChange={e => setFormData({...formData, pensionNo: e.target.value})}
                    onKeyDown={e => handleFetchEmployee(e, true)}
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label className="text-xs font-bold font-sans">Employee Name <span className="text-red-400">*</span></Label>
                <Input 
                  placeholder="Enter employee Name" 
                  className={`bg-muted/20 border-border/50 h-10 font-sans${errors.empName ? ' border-red-500' : ''}`}
                  value={formData.empName} 
                  onChange={e => setFormData({...formData, empName: e.target.value})}
                />
                {errors.empName && <p className="text-xs text-red-400 mt-1">{errors.empName}</p>}
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold font-sans">Total Amount <span className="text-red-400">*</span></Label>
                <Input 
                  type="number"
                  placeholder="0.00" 
                  className={`bg-muted/20 border-border/50 h-10 font-mono${errors.totalAmount ? ' border-red-500' : ''}`}
                  value={formData.totalAmount} 
                  onChange={e => setFormData({...formData, totalAmount: e.target.value})}
                />
                {errors.totalAmount && <p className="text-xs text-red-400 mt-1">{errors.totalAmount}</p>}
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold font-sans">Remaining Amount</Label>
                <Input 
                  type="number"
                  placeholder="0.00" 
                  className="bg-muted/20 border-border/50 h-10 font-mono text-rose-400"
                  value={formData.remainingAmount} 
                  onChange={e => setFormData({...formData, remainingAmount: e.target.value})}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card overflow-hidden border-none shadow-lg">
            <div className="h-2 bg-amber-500/50" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg flex items-center gap-2 font-heading">
                <CreditCard className="w-5 h-5 text-amber-400" />
                Cheque Entry Tracking
              </CardTitle>
              <Button size="sm" variant="outline" className="h-7 gap-1 text-xs border-amber-500/30 text-amber-500 hover:bg-amber-500/10" onClick={addChequeRow}>
                + Add Another Cheque
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {cheques.map((cheque, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end p-4 bg-muted/5 rounded-lg border border-border/30 relative group shadow-sm transition-all hover:bg-muted/10">
                    <div className="md:col-span-2 space-y-1">
                      <Label className="text-[10px] text-muted-foreground uppercase font-sans">Cheque Pos</Label>
                      <Input className="bg-muted/20 border-border/50 font-sans text-[11px] h-9 text-amber-500 font-bold" value={cheque.order} onChange={e => updateCheque(index, 'order', e.target.value)} />
                    </div>
                    <div className="md:col-span-3 space-y-1">
                      <Label className="text-[10px] text-muted-foreground uppercase font-sans">Cheque No {index === 0 && <span className="text-red-400">*</span>}</Label>
                      <Input className="bg-muted/10 border-border/50 font-mono text-sm h-9" placeholder="CHQ-..." value={cheque.chequeNo} onChange={e => updateCheque(index, 'chequeNo', e.target.value)} />
                    </div>
                    <div className="md:col-span-3 space-y-1">
                      <Label className="text-[10px] text-muted-foreground uppercase font-sans">Amount</Label>
                      <Input type="number" className="bg-muted/10 border-border/50 font-mono text-sm h-9" placeholder="0.00" value={cheque.amount} onChange={e => updateCheque(index, 'amount', e.target.value)} />
                    </div>
                    <div className="md:col-span-3 space-y-1">
                      <Label className="text-[10px] text-muted-foreground uppercase font-sans">Cheque Date</Label>
                      <Input type="date" className="bg-muted/10 border-border/50 font-mono text-xs h-9" value={cheque.date} onChange={e => updateCheque(index, 'date', e.target.value)} />
                    </div>
                    <div className="md:col-span-1 flex justify-center pb-0.5">
                      {cheques.length > 1 && (
                        <Button variant="ghost" size="sm" className="h-8 w-8 text-rose-500 hover:bg-rose-500/10 p-0" title="Remove" onClick={() => removeCheque(index)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <Card className="glass-card overflow-hidden border-none shadow-md bg-primary/5">
            <div className="h-2 bg-primary/50" />
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-primary font-heading">General Record</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="space-y-1">
                  <Label className="text-[10px] font-sans">Serial Number</Label>
                  <Input placeholder="Auto" disabled className="bg-background/50 border-border/50 h-8 font-mono text-xs" value={formData.serialNo} />
               </div>
               <div className="space-y-1">
                  <Label className="text-[10px] font-sans">Disbursed Date</Label>
                  <Input type="date" className="bg-background/50 border-border/50 h-8 text-xs font-mono" value={formData.disbursedOn} onChange={e => setFormData({...formData, disbursedOn: e.target.value})} />
               </div>
               <div className="space-y-1 pt-2">
                  <Label className="text-[10px] font-sans">Record Status</Label>
                  <Select value={formData.recordStatus} onValueChange={v => setFormData({...formData, recordStatus: v})}>
                    <SelectTrigger className="bg-background border-border/50 h-8 text-xs font-sans">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active Entry</SelectItem>
                      <SelectItem value="close">Closed Entry</SelectItem>
                    </SelectContent>
                  </Select>
               </div>
            </CardContent>
          </Card>

          <Card className="glass-card overflow-hidden border-none shadow-xl border-primary/20 bg-primary/10">
            <CardHeader className="pb-0">
               <CardTitle className="text-xs font-bold text-primary flex items-center gap-2 font-heading">
                 <Calculator className="w-3.5 h-3.5" /> SUMMARY
               </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-2">
               <div className="flex justify-between items-center bg-black/40 p-3 rounded-md border border-primary/20">
                  <span className="text-[10px] font-bold text-muted-foreground font-sans">TOTAL DISBURSED</span>
                  <span className="text-xl font-bold text-primary font-mono tracking-tighter">{calculateTotal()}</span>
               </div>
            </CardContent>
          </Card>

        </div>
      </div>

      {/* Grid List Bottom */}
      <Card className="glass-card overflow-hidden border-none shadow-md mt-6">
        <div className="h-2 bg-indigo-500/50" />
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-indigo-400" />
            Recent Cheque Entries
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border/50 overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Serial</TableHead>
                  <TableHead>Emp No</TableHead>
                  <TableHead>Employee Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Cheques (Comma Separated)</TableHead>
                  <TableHead>Disbursed Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.length > 0 ? (
                  records.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.serial_no || 'N/A'}</TableCell>
                      <TableCell>{r.emp_no || 'N/A'}</TableCell>
                      <TableCell>{r.emp_name}</TableCell>
                      <TableCell className="capitalize">{r.emp_status || 'Unknown'}</TableCell>
                      <TableCell>{[r.cheque_no_1, r.cheque_no_2, r.cheque_no_3, r.cheque_no_4].filter(Boolean).join(',')}</TableCell>
                      <TableCell>{r.total_disbursed}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                     <TableCell colSpan={6} className="text-center text-muted-foreground">No records found</TableCell>
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
