import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { User, Wallet, Calculator, CreditCard, RotateCcw, Save, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useVoice } from "@/contexts/VoiceContext";
import { toast } from "sonner";

export default function RegularEmployee() {
  const { openModal, formData, setOpenModal } = useVoice();
  const [empName, setEmpName] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [empNo, setEmpNo] = useState("");
  const [category, setCategory] = useState("");
  const [billPassedOn, setBillPassedOn] = useState("");
  const [disbursedOn, setDisbursedOn] = useState("");
  const [status, setStatus] = useState("active");
  const [chequeNo, setChequeNo] = useState("");
  const [balance, setBalance] = useState("");
  const [chequeAmount, setChequeAmount] = useState("");
  const [amountInWords, setAmountInWords] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (openModal === 'employee') {
      if (formData.name) setEmpName(formData.name);
      if (formData.amount) setTotalAmount(formData.amount.toString());
      setOpenModal(null);
    }
  }, [openModal, formData, setOpenModal]);

  const handleReset = (silent = false) => {
    setEmpName(""); setTotalAmount(""); setEmpNo(""); setCategory("");
    setBillPassedOn(""); setDisbursedOn(""); setStatus("active");
    setChequeNo(""); setBalance(""); setChequeAmount(""); setAmountInWords("");
    setErrors({});
    if (!silent) toast.info("Form reset successfully.");
  };

  const handleSave = async () => {
    const newErrors: Record<string, string> = {};
    if (!empNo.trim()) newErrors.empNo = "Employee No is required";
    if (!empName.trim()) newErrors.empName = "Employee Name is required";
    if (!category) newErrors.category = "Please select Category";
    if (!billPassedOn) newErrors.billPassedOn = "Bill Passed Date is required";
    if (!totalAmount || parseFloat(totalAmount) <= 0) newErrors.totalAmount = "Total Amount must be greater than 0";
    if (!chequeNo.trim()) newErrors.chequeNo = "Cheque No is required";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error(`${Object.keys(newErrors).length} required field(s) incomplete!`);
      return;
    }
    setErrors({});
    setIsSaving(true);
    try {
      toast.success("Record saved successfully!");
      handleReset(true);
    } catch (err: any) {
      toast.error("Error: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };
  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading">Regular Employee Funds (CP Fund)</h1>
          <p className="text-sm text-muted-foreground font-sans">Manage CP Fund, Supp Salaries, House Building and other regular disbursements</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2 font-sans" onClick={() => handleReset()}>
            <RotateCcw className="w-4 h-4" /> Reset
          </Button>
          <Button size="sm" className="gap-2 bg-primary hover:bg-primary/90 font-sans" onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Record
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="glass-card overflow-hidden border-none shadow-md">
            <div className="h-2 bg-primary" />
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 font-heading">
                <User className="w-5 h-5 text-primary" />
                Employee Basic
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-sans">Employee No <span className="text-red-400">*</span></Label>
                <Input value={empNo} onChange={e => setEmpNo(e.target.value)} placeholder="EMP-XXXX" className={`bg-muted/20 border-border/50 h-9 font-sans${errors.empNo ? ' border-red-500' : ''}`} />
                {errors.empNo && <p className="text-xs text-red-400 mt-1">{errors.empNo}</p>}
              </div>
              <div className="space-y-2">
                <Label className="font-sans">Serial No (Id)</Label>
                <Input placeholder="Auto" disabled className="bg-muted/30 border-border/50 h-9 font-sans" />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label className="font-sans">Employee Name <span className="text-red-400">*</span></Label>
                <Input 
                  placeholder="Full Name" 
                  value={empName}
                  onChange={(e) => setEmpName(e.target.value)}
                  className={`bg-muted/20 border-border/50 h-9 font-sans${errors.empName ? ' border-red-500' : ''}`}
                />
                {errors.empName && <p className="text-xs text-red-400 mt-1">{errors.empName}</p>}
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label className="font-sans font-bold text-rose-400">Category (Regular Emp) <span className="text-red-400">*</span></Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className={`bg-primary/5 border-primary/20 h-10 font-bold text-primary font-sans${errors.category ? ' border-red-500' : ''}`}>
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cp-fund">CP Fund</SelectItem>
                    <SelectItem value="supp-salary">Supp Salary</SelectItem>
                    <SelectItem value="house-building">House Building</SelectItem>
                    <SelectItem value="tada">TADA</SelectItem>
                    <SelectItem value="overtime">Overtime</SelectItem>
                  </SelectContent>
                </Select>
                {errors.category && <p className="text-xs text-red-400 mt-1">{errors.category}</p>}
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card overflow-hidden border-none shadow-md">
            <div className="h-2 bg-emerald-500/50" />
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 font-heading">
                <Calculator className="w-5 h-5 text-emerald-400" />
                Billing & Disbursement Status
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-sans">Bill Passed (Date) <span className="text-red-400">*</span></Label>
                <Input type="date" value={billPassedOn} onChange={e => setBillPassedOn(e.target.value)} className={`bg-muted/20 border-border/50 h-9 font-sans${errors.billPassedOn ? ' border-red-500' : ''}`} />
                {errors.billPassedOn && <p className="text-xs text-red-400 mt-1">{errors.billPassedOn}</p>}
              </div>
              <div className="space-y-2">
                <Label className="font-sans">Disbursed (Date)</Label>
                <Input type="date" value={disbursedOn} onChange={e => setDisbursedOn(e.target.value)} className="bg-muted/20 border-border/50 h-9 font-sans" />
              </div>
              <div className="space-y-2">
                <Label className="font-sans">Status</Label>
                <Select>
                  <SelectTrigger className="bg-muted/20 border-border/50 h-9 font-sans font-medium">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="close">Close</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="font-sans text-amber-400 font-bold">Cheque No <span className="text-red-400">*</span></Label>
                <Input value={chequeNo} onChange={e => setChequeNo(e.target.value)} className={`bg-amber-500/5 border-amber-500/20 h-9 text-amber-500 font-bold font-sans font-mono${errors.chequeNo ? ' border-red-500' : ''}`} placeholder="CHQ-XXXX" />
                {errors.chequeNo && <p className="text-xs text-red-400 mt-1">{errors.chequeNo}</p>}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="glass-card overflow-hidden border-none shadow-lg">
            <div className="h-2 bg-primary" />
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 font-heading">
                <Wallet className="w-5 h-5 text-primary" />
                Financial Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 font-sans text-sm">
              <div className="space-y-1">
                <Label className="text-xs">Total Amount <span className="text-red-400">*</span></Label>
                <Input 
                  type="number" 
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  className={`bg-muted/20 border-border/50 h-9 font-mono${errors.totalAmount ? ' border-red-500' : ''}`}
                />
                {errors.totalAmount && <p className="text-xs text-red-400 mt-1">{errors.totalAmount}</p>}
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Balance</Label>
                <Input type="number" value={balance} onChange={e => setBalance(e.target.value)} className="bg-muted/20 border-border/50 h-9 font-mono text-rose-400" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold text-primary">Cheque Amount (Current)</Label>
                <Input type="number" className="bg-primary/5 border-primary/20 h-9 font-mono text-primary font-bold" />
              </div>
              <div className="space-y-1 pt-2">
                 <Label className="text-xs">Amount in Words</Label>
                 <Input className="bg-muted/20 border-border/50 h-12 text-xs" placeholder="e.g. Ten Thousand Only..." />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
