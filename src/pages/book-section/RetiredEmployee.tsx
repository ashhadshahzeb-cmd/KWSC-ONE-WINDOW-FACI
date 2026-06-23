import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { User, Landmark, Calendar, Search, Save, RotateCcw, Image as ImageIcon, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function RetiredEmployee() {
  const [photo] = useState<string | null>(null);
  const [pensionNo, setPensionNo] = useState("");
  const [cnicNo, setCnicNo] = useState("");
  const [empNo, setEmpNo] = useState("");
  const [empName, setEmpName] = useState("");
  const [category, setCategory] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [retiredDate, setRetiredDate] = useState("");
  const [billPassedOn, setBillPassedOn] = useState("");
  const [nominees, setNominees] = useState("");
  const [bankDetails, setBankDetails] = useState("");
  const [totalAmountPayable, setTotalAmountPayable] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleReset = (silent = false) => {
    setPensionNo(""); setCnicNo(""); setEmpNo(""); setEmpName(""); setCategory("");
    setAppointmentDate(""); setRetiredDate(""); setBillPassedOn("");
    setNominees(""); setBankDetails(""); setTotalAmountPayable("");
    setErrors({});
    if (!silent) toast.info("Form reset successfully.");
  };

  const handleSave = async () => {
    const newErrors: Record<string, string> = {};
    if (!pensionNo.trim()) newErrors.pensionNo = "Pension No is required";
    if (!empNo.trim()) newErrors.empNo = "Employee No is required";
    if (!empName.trim()) newErrors.empName = "Employee Name is required";
    if (!category) newErrors.category = "Please select Category";
    if (!retiredDate) newErrors.retiredDate = "Retired Date is required";
    if (!billPassedOn) newErrors.billPassedOn = "Bill Passed Date is required";
    if (!bankDetails.trim()) newErrors.bankDetails = "Bank Details are required";
    if (!totalAmountPayable || parseFloat(totalAmountPayable) <= 0) newErrors.totalAmountPayable = "Total Amount must be greater than 0";
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
          <h1 className="text-2xl font-bold font-heading">Retired Employee Records (Pension/LPR)</h1>
          <p className="text-sm text-muted-foreground font-sans">Manage pension funds, LPR, gratuity and financial assistance for retired staff</p>
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
                Retired Staff Identification
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-sans">Pension No <span className="text-red-400">*</span></Label>
                <Input value={pensionNo} onChange={e => setPensionNo(e.target.value)} placeholder="PEN-XXXX" className={`bg-muted/20 border-border/50 h-9 font-sans font-mono${errors.pensionNo ? ' border-red-500' : ''}`} />
                {errors.pensionNo && <p className="text-xs text-red-400 mt-1">{errors.pensionNo}</p>}
              </div>
              <div className="space-y-2">
                <Label className="font-sans">CNIC No</Label>
                <Input value={cnicNo} onChange={e => setCnicNo(e.target.value)} placeholder="00000-0000000-0" className="bg-muted/20 border-border/50 h-9 font-mono" />
              </div>
              <div className="space-y-2">
                <Label className="font-sans">Employee No <span className="text-red-400">*</span></Label>
                <Input value={empNo} onChange={e => setEmpNo(e.target.value)} placeholder="EMP-XXXX" className={`bg-muted/20 border-border/50 h-9 font-sans font-mono${errors.empNo ? ' border-red-500' : ''}`} />
                {errors.empNo && <p className="text-xs text-red-400 mt-1">{errors.empNo}</p>}
              </div>
              <div className="space-y-2">
                <Label className="font-sans">Employee Name <span className="text-red-400">*</span></Label>
                <Input value={empName} onChange={e => setEmpName(e.target.value)} placeholder="Full Name" className={`bg-muted/20 border-border/50 h-9 font-sans${errors.empName ? ' border-red-500' : ''}`} />
                {errors.empName && <p className="text-xs text-red-400 mt-1">{errors.empName}</p>}
              </div>
              <div className="md:col-span-2 space-y-2 mt-2">
                <Label className="font-sans font-bold text-blue-400">Retired Status Category <span className="text-red-400">*</span></Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className={`bg-blue-500/5 border-blue-500/20 h-10 font-bold text-blue-400 font-sans${errors.category ? ' border-red-500' : ''}`}>
                    <SelectValue placeholder="Select Sector" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fund">Fund</SelectItem>
                    <SelectItem value="lpr">LPR</SelectItem>
                    <SelectItem value="pension-gratuity">Pension Gratuity</SelectItem>
                    <SelectItem value="pension-arrear">Pension Arrear</SelectItem>
                    <SelectItem value="financial-assistance">Financial Assistance</SelectItem>
                    <SelectItem value="group-insurance">Group Insurance</SelectItem>
                  </SelectContent>
                </Select>
                {errors.category && <p className="text-xs text-red-400 mt-1">{errors.category}</p>}
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card overflow-hidden border-none shadow-md">
            <div className="h-2 bg-amber-500/50" />
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 font-heading">
                <Calendar className="w-5 h-5 text-amber-400" />
                Service Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="font-sans text-xs">Appointment Date</Label>
                <Input type="date" value={appointmentDate} onChange={e => setAppointmentDate(e.target.value)} className="bg-muted/20 border-border/50 h-9 text-xs font-mono" />
              </div>
              <div className="space-y-2">
                <Label className="font-sans text-xs">Retired Date <span className="text-red-400">*</span></Label>
                <Input type="date" value={retiredDate} onChange={e => setRetiredDate(e.target.value)} className={`bg-muted/20 border-border/50 h-9 text-xs font-mono${errors.retiredDate ? ' border-red-500' : ''}`} />
                {errors.retiredDate && <p className="text-xs text-red-400 mt-1">{errors.retiredDate}</p>}
              </div>
              <div className="space-y-2">
                <Label className="font-sans text-xs">Bill Passed On <span className="text-red-400">*</span></Label>
                <Input type="date" value={billPassedOn} onChange={e => setBillPassedOn(e.target.value)} className={`bg-muted/20 border-border/50 h-9 text-xs font-mono${errors.billPassedOn ? ' border-red-500' : ''}`} />
                {errors.billPassedOn && <p className="text-xs text-red-400 mt-1">{errors.billPassedOn}</p>}
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card overflow-hidden border-none shadow-md">
            <div className="h-2 bg-purple-500/50" />
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 font-heading text-purple-400">
                <User className="w-5 h-5" /> Documentation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label className="font-sans text-xs font-semibold">Nominees for Pension</Label>
                <Input value={nominees} onChange={e => setNominees(e.target.value)} placeholder="Enter nominee names and relationship..." className="bg-muted/20 border-border/50 h-9 text-xs font-sans" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="glass-card overflow-hidden border-none shadow-lg text-center">
            <div className="h-2 bg-primary" />
            <CardHeader className="py-3">
              <CardTitle className="text-xs font-bold uppercase tracking-widest font-heading">Verification Photo</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <div className="w-32 h-32 rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 flex items-center justify-center overflow-hidden relative group">
                {photo ? (
                  <img src={photo} alt="Retired Profile" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-12 h-12 text-muted-foreground/50" />
                )}
              </div>
              <Button variant="outline" size="sm" className="w-full text-[10px] uppercase font-bold tracking-tight h-8 font-sans">Browse Records</Button>
            </CardContent>
          </Card>

          <Card className="glass-card overflow-hidden border-none shadow-lg">
            <div className="h-2 bg-emerald-500/50" />
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2 font-heading">
                <Landmark className="w-5 h-5 text-emerald-400" />
                Payment Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label className="text-xs font-sans font-medium">Bank Details <span className="text-red-400">*</span></Label>
                <Input value={bankDetails} onChange={e => setBankDetails(e.target.value)} placeholder="Bank Name, Branch & Account" className={`bg-muted/20 border-border/50 h-10 text-xs font-sans${errors.bankDetails ? ' border-red-500' : ''}`} />
                {errors.bankDetails && <p className="text-xs text-red-400 mt-1">{errors.bankDetails}</p>}
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-sans font-medium">Total Amount Payable <span className="text-red-400">*</span></Label>
                <Input type="number" value={totalAmountPayable} onChange={e => setTotalAmountPayable(e.target.value)} className={`bg-primary/5 border-primary/20 h-10 font-mono text-primary font-bold${errors.totalAmountPayable ? ' border-red-500' : ''}`} />
                {errors.totalAmountPayable && <p className="text-xs text-red-400 mt-1">{errors.totalAmountPayable}</p>}
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-none bg-primary/5 p-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Quick Pension Lookup..." className="pl-9 h-9 text-xs bg-background/50 border-border/50 font-sans" />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
