import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, Calendar, ImageIcon, Search, Save, RotateCcw, Trash2, Wallet, Users, Eye, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

const formatDateDisplay = (dateStr: string | null) => {
  if (!dateStr) return "---";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
};

const getSubCatLabel = (val: string | null) => {
  if (!val) return "---";
  const mapping: Record<string, string> = {
    'cp-fund': 'CP Fund',
    'funds': 'Funds',
    'supp-salary': 'Supp Salary',
    'house-building': 'House Building',
    'tada': 'TADA',
    'overtime': 'Overtime',
    'fund': 'Fund',
    'lpr': 'LPR',
    'pension-gratuity': 'Pension Gratuity',
    'pension-arrear': 'Pension Arrear',
    'financial-assistance': 'Financial Assistance'
  };
  return mapping[val] || val;
};

export default function EmpDetails() {
  const navigate = useNavigate();
  const [photo, setPhoto] = useState<string | null>(null);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedViewRecord, setSelectedViewRecord] = useState<any>(null);

  // Form States
  const [empNo, setEmpNo] = useState("");
  const [formData, setFormData] = useState({
    serialNo: "",
    pensionNo: "",
    empName: "",
    cnic: "",
    nominees: "",
    appointment: "",
    retiredDate: "",
    regularCategory: "",
    retiredCategory: "",
    status: "active",
    disbursedDate: "",
    bankDetails: "",
    totalAmount: "",
    balance: "",
    chequeAmount: "",
    amountWords: "",
    // Cheque Details & PMR Tracking
    chequeNo: "",
    chequeDate: "",
    natureOfBill: "",
    pmrNo: "",
    pmrDate: "",
    chequeBreakUp: "",
    passingDate: "",
    entryDate: "",
    paymentDate: "",
    paidAmount: "",
    deduction: "",
    // Fund Allocations
    fundAmount: "",
    salAmount: "",
    penAmount: "",
    lprAmount: "",
    disbAmount: "",
    medAmount: "",
    ginsAmount: "",
    otherAmount: "",
    totalDisbursement: "",
    refCareOf: "",
    bankStatus: "PENDING",
  });

  const [records, setRecords] = useState<any[]>([]);
  const [employeeHistory, setEmployeeHistory] = useState<any[]>([]);
  const [bottomSearch, setBottomSearch] = useState("");

  // Dynamic Auto-Calculations
  useEffect(() => {
    const tot = parseFloat(formData.totalAmount) || 0;
    const ded = parseFloat(formData.deduction) || 0;
    const net = tot - ded;
    
    // Auto-calculate Net Cheque Amount
    if (net !== (parseFloat(formData.chequeAmount) || 0)) {
      setFormData(prev => ({ ...prev, chequeAmount: net.toString() }));
    }
  }, [formData.totalAmount, formData.deduction]);

  useEffect(() => {
    const fund = parseFloat(formData.fundAmount) || 0;
    const sal = parseFloat(formData.salAmount) || 0;
    const pen = parseFloat(formData.penAmount) || 0;
    const lpr = parseFloat(formData.lprAmount) || 0;
    const disb = parseFloat(formData.disbAmount) || 0;
    const med = parseFloat(formData.medAmount) || 0;
    const gins = parseFloat(formData.ginsAmount) || 0;
    const other = parseFloat(formData.otherAmount) || 0;
    const totalDisb = fund + sal + pen + lpr + disb + med + gins + other;

    // Auto-calculate Total Disbursement
    if (totalDisb !== (parseFloat(formData.totalDisbursement) || 0)) {
      setFormData(prev => ({ ...prev, totalDisbursement: totalDisb.toString() }));
    }
  }, [
    formData.fundAmount, formData.salAmount, formData.penAmount, 
    formData.lprAmount, formData.disbAmount, formData.medAmount, 
    formData.ginsAmount, formData.otherAmount
  ]);

  // Fetch from unified table
  const fetchRecords = async (searchTerm = "") => {
    try {
      let query = supabase
        .from('book_section_employees')
        .select('*');

      if (searchTerm.trim() !== "") {
        const term = `%${searchTerm.trim()}%`;
        query = query.or(`employee_no.ilike.${term},pension_no.ilike.${term},full_name.ilike.${term},cnic_no.ilike.${term}`);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      if (data) setRecords(data);
    } catch (err) {
      console.error("Error fetching records:", err);
    }
  };

  useEffect(() => {
    fetchRecords(bottomSearch);
  }, [bottomSearch]);

  // Handle Photo Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileToUpload(file);
      const reader = new FileReader();
      reader.onload = (event) => setPhoto(event.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  // Perform Consolidated Search
  const performSearch = async (searchValue: string, isPension: boolean) => {
    toast.info(`Searching records for ${isPension ? 'Pension No' : 'Employee No'}: ${searchValue}...`);
    try {
      const query = supabase
        .from('book_section_employees')
        .select('*');
      
      if (isPension) {
        query.eq('pension_no', searchValue);
      } else {
        query.eq('employee_no', searchValue);
      }

      const { data, error } = await query.order('passing_date', { ascending: false }).limit(10000);

      if (error) throw error;

      if (data && data.length > 0) {
        // Find latest profile data
        const profileRecord = data.find(r => r.full_name) || data[0];
        
        setFormData({
          serialNo: profileRecord.serial_no || "",
          pensionNo: profileRecord.pension_no || "",
          empName: profileRecord.full_name || "",
          cnic: profileRecord.cnic_no || "",
          nominees: profileRecord.nominees || "",
          appointment: profileRecord.appointment_date || "",
          retiredDate: profileRecord.retired_date || "",
          regularCategory: profileRecord.sub_category_regular || "",
          retiredCategory: profileRecord.sub_category_retired || "",
          status: profileRecord.status || "active",
          disbursedDate: profileRecord.disbursed_date || "",
          bankDetails: profileRecord.bank_details || "",
          totalAmount: profileRecord.total_amount?.toString() || "0",
          balance: profileRecord.balance_amount?.toString() || "0",
          chequeAmount: profileRecord.cheque_amount?.toString() || "0",
          amountWords: profileRecord.amount_in_words || "",
          // Prefill upgraded columns
          chequeNo: profileRecord.cheque_no || "",
          chequeDate: profileRecord.cheque_date || "",
          natureOfBill: profileRecord.nature_of_bill || "",
          pmrNo: profileRecord.pmr_no || "",
          pmrDate: profileRecord.pmr_date || "",
          chequeBreakUp: profileRecord.cheque_break_up || "",
          passingDate: profileRecord.passing_date || "",
          entryDate: profileRecord.entry_date || "",
          paymentDate: profileRecord.payment_date || "",
          paidAmount: profileRecord.paid_amount?.toString() || "0",
          deduction: profileRecord.deduction?.toString() || "0",
          fundAmount: profileRecord.fund_amount?.toString() || "0",
          salAmount: profileRecord.sal_amount?.toString() || "0",
          penAmount: profileRecord.pen_amount?.toString() || "0",
          lprAmount: profileRecord.lpr_amount?.toString() || "0",
          disbAmount: profileRecord.disb_amount?.toString() || "0",
          medAmount: profileRecord.med_amount?.toString() || "0",
          ginsAmount: profileRecord.gins_amount?.toString() || "0",
          otherAmount: profileRecord.other_amount?.toString() || "0",
          totalDisbursement: profileRecord.total_disbursement?.toString() || "0",
          refCareOf: profileRecord.ref_care_of || "",
          bankStatus: profileRecord.bank_status || "PENDING",
        });

        if (!isPension) {
          if (profileRecord.pension_no) {
            setFormData(prev => ({ ...prev, pensionNo: profileRecord.pension_no }));
          }
        } else {
          if (profileRecord.employee_no) {
            setEmpNo(profileRecord.employee_no);
          }
        }

        setPhoto(profileRecord.photo_url || null);
        setEmployeeHistory(data);
        toast.success(`Found ${data.length} historical record(s)`);
      } else {
        setEmployeeHistory([]);
        toast.error('No record found in unified database');
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Search failed: ' + err.message);
    }
  };

  // Search Logic (Enter key)
  const handleFetchEmployee = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const searchValue = empNo?.trim();
      if (!searchValue) return;
      await performSearch(searchValue, false);
    }
  };

  const handleFetchPension = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const searchValue = formData.pensionNo?.trim();
      if (!searchValue) return;
      await performSearch(searchValue, true);
    }
  };

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!formData.empName) return toast.error("Employee Name is required!");
    if (!empNo && !formData.pensionNo) return toast.error("Employee No or Pension No must be provided.");

    setIsSaving(true);
    try {
      let publicUrl = photo;

      // 1. Image Upload
      if (fileToUpload) {
        setUploadingImage(true);
        const fileExt = fileToUpload.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `emp_photos/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('bucket_assets') 
          .upload(filePath, fileToUpload);

        if (uploadError) throw uploadError;

        const { data: { publicUrl: url } } = supabase.storage
          .from('bucket_assets')
          .getPublicUrl(filePath);
        
        publicUrl = url;
      }

      // 2. automated Category Selection
      const category = empNo.trim() !== "" ? "Employed" : "Retired";

      // 3. Save to Unified Table
      const { error } = await supabase.from('book_section_employees').upsert({
        id: selectedViewRecord?.id || undefined, // Upsert if existing record
        employee_no: empNo || null,
        pension_no: formData.pensionNo || null,
        full_name: formData.empName,
        cnic_no: formData.cnic || null,
        nominees: formData.nominees || null,
        appointment_date: formData.appointment || null,
        retired_date: formData.retiredDate || null,
        disbursed_date: formData.disbursedDate || null,
        sub_category_regular: formData.regularCategory || null,
        sub_category_retired: formData.retiredCategory || null,
        status: formData.status || 'active',
        bank_details: formData.bankDetails || null,
        total_amount: parseFloat(formData.totalAmount) || 0,
        balance_amount: parseFloat(formData.balance) || 0,
        cheque_amount: parseFloat(formData.chequeAmount) || 0,
        amount_in_words: formData.amountWords || null,
        category: category,
        photo_url: publicUrl,
        serial_no: formData.serialNo || null,
        // Map new fields
        cheque_no: formData.chequeNo || null,
        cheque_date: formData.chequeDate || null,
        nature_of_bill: formData.natureOfBill || null,
        pmr_no: formData.pmrNo || null,
        pmr_date: formData.pmrDate || null,
        cheque_break_up: formData.chequeBreakUp || null,
        passing_date: formData.passingDate || null,
        entry_date: formData.entryDate || null,
        payment_date: formData.paymentDate || null,
        paid_amount: parseFloat(formData.paidAmount) || 0,
        deduction: parseFloat(formData.deduction) || 0,
        fund_amount: parseFloat(formData.fundAmount) || 0,
        sal_amount: parseFloat(formData.salAmount) || 0,
        pen_amount: parseFloat(formData.penAmount) || 0,
        lpr_amount: parseFloat(formData.lprAmount) || 0,
        disb_amount: parseFloat(formData.disbAmount) || 0,
        med_amount: parseFloat(formData.medAmount) || 0,
        gins_amount: parseFloat(formData.ginsAmount) || 0,
        other_amount: parseFloat(formData.otherAmount) || 0,
        total_disbursement: parseFloat(formData.totalDisbursement) || 0,
        ref_care_of: formData.refCareOf || null,
        bank_status: formData.bankStatus || 'PENDING',
      });

      if (error) throw error;
      toast.success(`${category} record saved to unified database!`);
      handleReset();
      fetchRecords(); 

      // Redirect logic
      setTimeout(() => {
        navigate('/book-section/cheque-record', {
          state: {
            empName: formData.empName,
            empNo: empNo,
            pensionNo: formData.pensionNo,
            empStatus: category.toLowerCase(),
            totalAmount: formData.totalAmount,
            remainingBalance: formData.balance,
            photoUrl: publicUrl
          }
        });
      }, 1500);
    } catch (err: any) {
      toast.error('Storage/Save failed: ' + err.message);
    } finally {
      setIsSaving(false);
      setUploadingImage(false);
    }
  };

  const handleReset = () => {
    setEmpNo("");
    setFormData({
      serialNo: "",
      pensionNo: "",
      empName: "",
      cnic: "",
      nominees: "",
      appointment: "",
      retiredDate: "",
      regularCategory: "",
      retiredCategory: "",
      status: "active",
      disbursedDate: "",
      bankDetails: "",
      totalAmount: "",
      balance: "",
      chequeAmount: "",
      amountWords: "",
      chequeNo: "",
      chequeDate: "",
      natureOfBill: "",
      pmrNo: "",
      pmrDate: "",
      chequeBreakUp: "",
      passingDate: "",
      entryDate: "",
      paymentDate: "",
      paidAmount: "",
      deduction: "",
      fundAmount: "",
      salAmount: "",
      penAmount: "",
      lprAmount: "",
      disbAmount: "",
      medAmount: "",
      ginsAmount: "",
      otherAmount: "",
      totalDisbursement: "",
      refCareOf: "",
      bankStatus: "PENDING",
    });
    setPhoto(null);
    setFileToUpload(null);
    setSelectedViewRecord(null);
    setEmployeeHistory([]);
    toast.info('Form reset');
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Employee Records Management</h1>
          <p className="text-sm text-muted-foreground/80 font-sans">Comprehensive portal for Regular (Employed) and Retired (Pension) staff</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={handleReset}>
            <RotateCcw className="w-4 h-4" /> Reset
          </Button>
          <Button variant="destructive" size="sm" className="gap-2">
            <Trash2 className="w-4 h-4" /> Delete
          </Button>
          <Button size="sm" className="gap-2 bg-primary hover:bg-primary/90" onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Record
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Card className="glass-card overflow-hidden border-none shadow-md h-full">
            <div className="h-2 bg-primary" />
            <CardHeader className="py-4 px-6 border-b border-white/5">
              <CardTitle className="text-lg flex items-center gap-2 font-heading tracking-wide">
                <User className="w-5 h-5 text-primary" /> Staff Identification
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="id" className="text-xs uppercase font-bold tracking-tighter text-muted-foreground">Serial No (Id)</Label>
                  <Input id="id" placeholder="Auto-gen" className="bg-muted/10 border-border/50 h-10" value={formData.serialNo} onChange={e => setFormData({ ...formData, serialNo: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="empNo" className="text-xs uppercase font-bold tracking-tighter text-blue-500">Employee NO (regular)</Label>
                  <Input
                    id="empNo"
                    placeholder="EMP-XXXX"
                    className="bg-blue-500/5 border-blue-500/30 h-10 font-mono focus:border-blue-500"
                    value={empNo}
                    onChange={(e) => setEmpNo(e.target.value)}
                    onKeyDown={handleFetchEmployee}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="pensionNo" className="text-xs uppercase font-bold tracking-tighter text-rose-500">Pension NO (retired)</Label>
                  <Input 
                    id="pensionNo" 
                    placeholder="PEN-XXXX" 
                    className="bg-rose-500/5 border-rose-500/30 h-10 font-mono focus:border-rose-500" 
                    value={formData.pensionNo} 
                    onChange={e => setFormData({ ...formData, pensionNo: e.target.value })} 
                    onKeyDown={handleFetchPension}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="empName" className="text-xs uppercase font-bold tracking-tight">Employee Name</Label>
                <Input id="empName" placeholder="Enter full name of staff member" className="bg-muted/10 border-border/50 h-10" value={formData.empName} onChange={e => setFormData({ ...formData, empName: e.target.value })} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="cnic" className="text-xs uppercase font-bold tracking-tight">CNIC No</Label>
                  <Input id="cnic" placeholder="00000-0000000-0" className="bg-muted/10 border-border/50 font-mono h-10" value={formData.cnic} onChange={e => setFormData({ ...formData, cnic: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="nominees" className="text-xs uppercase font-bold tracking-tight">Nominees</Label>
                  <Input id="nominees" placeholder="Enter nominee name and relation" className="bg-muted/10 border-border/50 h-10" value={formData.nominees} onChange={e => setFormData({ ...formData, nominees: e.target.value })} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="glass-card overflow-hidden border-none shadow-lg h-full group">
            <div className="h-2 bg-purple-500/50" />
            <CardHeader className="text-center py-4 bg-muted/20">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground group-hover:text-purple-400 transition-colors">Staff Verification Photo</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4 py-8">
              <div 
                className="w-40 h-40 rounded-2xl border-2 border-dashed border-primary/20 bg-primary/5 flex items-center justify-center overflow-hidden relative transition-all group-hover:border-primary/40 group-hover:bg-primary/10 cursor-pointer shadow-inner"
                onClick={() => document.getElementById('staffPhoto')?.click()}
              >
                {photo ? (
                  <img src={photo} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-16 h-16 text-muted-foreground/30" />
                )}
                <div className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                   <span className="text-white text-xs font-bold uppercase tracking-widest">Select New</span>
                </div>
                {uploadingImage && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-white" />
                  </div>
                )}
              </div>
              <input type="file" id="staffPhoto" hidden accept="image/*" onChange={handleFileChange} />
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">Recommended: Square Aspect Ratio</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="glass-card overflow-hidden border-none shadow-md w-full">
        <div className="h-2 bg-blue-500/50" />
        <CardHeader className="py-4 px-6 border-b border-white/5">
          <CardTitle className="text-lg flex items-center gap-2 font-heading tracking-wide">
            <Calendar className="w-5 h-5 text-blue-400" /> Administrative Details
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <Label htmlFor="appointment" className="text-xs uppercase font-bold text-muted-foreground">Appointment Date</Label>
              <Input id="appointment" type="date" className="bg-muted/10 border-border/50 h-10 font-mono" value={formData.appointment} onChange={e => setFormData({ ...formData, appointment: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="retiredDate" className="text-xs uppercase font-bold text-muted-foreground">Retired Date</Label>
              <Input id="retiredDate" type="date" className="bg-muted/10 border-border/50 h-10 font-mono" value={formData.retiredDate} onChange={e => setFormData({ ...formData, retiredDate: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="totalAmount" className="text-xs uppercase font-bold text-emerald-500">Total Amount</Label>
              <Input id="totalAmount" type="number" className="bg-emerald-500/5 border-emerald-500/20 h-10 font-mono text-emerald-500 font-bold" value={formData.totalAmount} onChange={e => setFormData({ ...formData, totalAmount: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="balance" className="text-xs uppercase font-bold text-rose-500">Remaining</Label>
              <Input id="balance" type="number" className="bg-rose-500/5 border-rose-500/20 h-10 font-mono text-rose-500 font-bold" value={formData.balance} onChange={e => setFormData({ ...formData, balance: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <Label className="text-xs uppercase font-bold">Sub Category (Regular)</Label>
              <Select value={formData.regularCategory} onValueChange={v => setFormData({ ...formData, regularCategory: v })}>
                <SelectTrigger className="bg-blue-500/5 border-blue-500/20 h-10 font-medium">
                  <SelectValue placeholder="Regular Sector" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cp-fund">CP Fund</SelectItem>
                  <SelectItem value="funds">Funds</SelectItem>
                  <SelectItem value="supp-salary">Supp Salary</SelectItem>
                  <SelectItem value="house-building">House Building</SelectItem>
                  <SelectItem value="tada">TADA</SelectItem>
                  <SelectItem value="overtime">Overtime</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs uppercase font-bold text-rose-500">Sub Category (Retired)</Label>
              <Select value={formData.retiredCategory} onValueChange={v => setFormData({ ...formData, retiredCategory: v })}>
                <SelectTrigger className="bg-rose-500/5 border-rose-500/20 h-10 font-medium text-rose-500">
                  <SelectValue placeholder="Retired Sector" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fund">Fund</SelectItem>
                  <SelectItem value="funds">Funds</SelectItem>
                  <SelectItem value="lpr">LPR</SelectItem>
                  <SelectItem value="pension-gratuity">Pension Gratuity</SelectItem>
                  <SelectItem value="pension-arrear">Pension Arrear</SelectItem>
                  <SelectItem value="financial-assistance">Financial Assistance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs uppercase font-bold">Current Status</Label>
              <Select value={formData.status} onValueChange={v => setFormData({ ...formData, status: v })}>
                <SelectTrigger className="bg-emerald-500/5 border-emerald-500/20 h-10 font-bold text-emerald-500 tracking-wider uppercase">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="close">Close</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financial & Cheque Details */}
      <Card className="glass-card overflow-hidden border-none shadow-md w-full">
        <div className="h-2 bg-emerald-500/50" />
        <CardHeader className="py-4 px-6 border-b border-white/5">
          <CardTitle className="text-lg flex items-center gap-2 font-heading tracking-wide">
            <Wallet className="w-5 h-5 text-emerald-400" /> Financial & Cheque Details
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1 col-span-1 md:col-span-2">
              <Label htmlFor="natureOfBill" className="text-xs uppercase font-bold text-muted-foreground">Nature of Bill</Label>
              <Input 
                id="natureOfBill" 
                placeholder="Enter nature of bill..." 
                className="bg-muted/10 border-border/50 h-10" 
                value={formData.natureOfBill} 
                onChange={e => setFormData({ ...formData, natureOfBill: e.target.value })} 
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="chequeNo" className="text-xs uppercase font-bold text-muted-foreground">Cheque No</Label>
              <Input 
                id="chequeNo" 
                placeholder="Enter cheque number..." 
                className="bg-muted/10 border-border/50 h-10 font-mono" 
                value={formData.chequeNo} 
                onChange={e => setFormData({ ...formData, chequeNo: e.target.value })} 
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="chequeDate" className="text-xs uppercase font-bold text-muted-foreground">Cheque Date</Label>
              <Input 
                id="chequeDate" 
                type="date" 
                className="bg-muted/10 border-border/50 h-10 font-mono" 
                value={formData.chequeDate} 
                onChange={e => setFormData({ ...formData, chequeDate: e.target.value })} 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <Label htmlFor="deduction" className="text-xs uppercase font-bold text-rose-400">Deduction (Rs.)</Label>
              <Input 
                id="deduction" 
                type="number" 
                className="bg-rose-500/5 border-rose-500/20 h-10 font-mono text-rose-400 font-bold" 
                value={formData.deduction} 
                onChange={e => setFormData({ ...formData, deduction: e.target.value })} 
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="chequeAmount" className="text-xs uppercase font-bold text-emerald-400">Net Cheque Amount (Rs.)</Label>
              <Input 
                id="chequeAmount" 
                type="number" 
                readOnly 
                disabled 
                className="bg-emerald-500/5 border-emerald-500/20 h-10 font-mono text-emerald-400 font-bold opacity-80" 
                value={formData.chequeAmount} 
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="paidAmount" className="text-xs uppercase font-bold text-blue-400">Paid Amount (Rs.)</Label>
              <Input 
                id="paidAmount" 
                type="number" 
                className="bg-blue-500/5 border-blue-500/20 h-10 font-mono text-blue-400 font-bold" 
                value={formData.paidAmount} 
                onChange={e => setFormData({ ...formData, paidAmount: e.target.value })} 
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="amountWords" className="text-xs uppercase font-bold text-muted-foreground">Amount in Words</Label>
              <Input 
                id="amountWords" 
                placeholder="Amount in words..." 
                className="bg-muted/10 border-border/50 h-10" 
                value={formData.amountWords} 
                onChange={e => setFormData({ ...formData, amountWords: e.target.value })} 
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PMR & Document Audit Trail */}
      <Card className="glass-card overflow-hidden border-none shadow-md w-full">
        <div className="h-2 bg-amber-500/50" />
        <CardHeader className="py-4 px-6 border-b border-white/5">
          <CardTitle className="text-lg flex items-center gap-2 font-heading tracking-wide">
            <Search className="w-5 h-5 text-amber-400" /> PMR & Document Audit Trail
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label htmlFor="pmrNo" className="text-xs uppercase font-bold text-muted-foreground">PMR No</Label>
              <Input 
                id="pmrNo" 
                placeholder="Enter PMR Number..." 
                className="bg-muted/10 border-border/50 h-10 font-mono" 
                value={formData.pmrNo} 
                onChange={e => setFormData({ ...formData, pmrNo: e.target.value })} 
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="pmrDate" className="text-xs uppercase font-bold text-muted-foreground">PMR Date</Label>
              <Input 
                id="pmrDate" 
                type="date" 
                className="bg-muted/10 border-border/50 h-10 font-mono" 
                value={formData.pmrDate} 
                onChange={e => setFormData({ ...formData, pmrDate: e.target.value })} 
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="chequeBreakUp" className="text-xs uppercase font-bold text-muted-foreground">Cheque Break-up</Label>
              <Input 
                id="chequeBreakUp" 
                placeholder="e.g. Details..." 
                className="bg-muted/10 border-border/50 h-10" 
                value={formData.chequeBreakUp} 
                onChange={e => setFormData({ ...formData, chequeBreakUp: e.target.value })} 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label htmlFor="passingDate" className="text-xs uppercase font-bold text-muted-foreground">Passing Date</Label>
              <Input 
                id="passingDate" 
                type="date" 
                className="bg-muted/10 border-border/50 h-10 font-mono" 
                value={formData.passingDate} 
                onChange={e => setFormData({ ...formData, passingDate: e.target.value })} 
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="entryDate" className="text-xs uppercase font-bold text-muted-foreground">Entry Date</Label>
              <Input 
                id="entryDate" 
                type="date" 
                className="bg-muted/10 border-border/50 h-10 font-mono" 
                value={formData.entryDate} 
                onChange={e => setFormData({ ...formData, entryDate: e.target.value })} 
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="paymentDate" className="text-xs uppercase font-bold text-muted-foreground">Payment Date</Label>
              <Input 
                id="paymentDate" 
                type="date" 
                className="bg-muted/10 border-border/50 h-10 font-mono" 
                value={formData.paymentDate} 
                onChange={e => setFormData({ ...formData, paymentDate: e.target.value })} 
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fund & Disbursement Allocations */}
      <Card className="glass-card overflow-hidden border-none shadow-md w-full">
        <div className="h-2 bg-purple-500/50" />
        <CardHeader className="py-4 px-6 border-b border-white/5">
          <CardTitle className="text-lg flex items-center gap-2 font-heading tracking-wide">
            <Wallet className="w-5 h-5 text-purple-400" /> Fund & Disbursement Breakdowns
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <Label htmlFor="fundAmount" className="text-xs uppercase font-bold text-muted-foreground">Fund Amount (Rs.)</Label>
              <Input 
                id="fundAmount" 
                type="number" 
                className="bg-muted/10 border-border/50 h-10 font-mono" 
                value={formData.fundAmount} 
                onChange={e => setFormData({ ...formData, fundAmount: e.target.value })} 
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="salAmount" className="text-xs uppercase font-bold text-muted-foreground">Salary Amount (Rs.)</Label>
              <Input 
                id="salAmount" 
                type="number" 
                className="bg-muted/10 border-border/50 h-10 font-mono" 
                value={formData.salAmount} 
                onChange={e => setFormData({ ...formData, salAmount: e.target.value })} 
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="penAmount" className="text-xs uppercase font-bold text-muted-foreground">Pension Amount (Rs.)</Label>
              <Input 
                id="penAmount" 
                type="number" 
                className="bg-muted/10 border-border/50 h-10 font-mono" 
                value={formData.penAmount} 
                onChange={e => setFormData({ ...formData, penAmount: e.target.value })} 
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="lprAmount" className="text-xs uppercase font-bold text-muted-foreground">LPR Amount (Rs.)</Label>
              <Input 
                id="lprAmount" 
                type="number" 
                className="bg-muted/10 border-border/50 h-10 font-mono" 
                value={formData.lprAmount} 
                onChange={e => setFormData({ ...formData, lprAmount: e.target.value })} 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <Label htmlFor="disbAmount" className="text-xs uppercase font-bold text-muted-foreground">Disbursement Amount (Rs.)</Label>
              <Input 
                id="disbAmount" 
                type="number" 
                className="bg-muted/10 border-border/50 h-10 font-mono" 
                value={formData.disbAmount} 
                onChange={e => setFormData({ ...formData, disbAmount: e.target.value })} 
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="medAmount" className="text-xs uppercase font-bold text-muted-foreground">Medical Claim (Rs.)</Label>
              <Input 
                id="medAmount" 
                type="number" 
                className="bg-muted/10 border-border/50 h-10 font-mono" 
                value={formData.medAmount} 
                onChange={e => setFormData({ ...formData, medAmount: e.target.value })} 
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="ginsAmount" className="text-xs uppercase font-bold text-muted-foreground">Group Insurance (Rs.)</Label>
              <Input 
                id="ginsAmount" 
                type="number" 
                className="bg-muted/10 border-border/50 h-10 font-mono" 
                value={formData.ginsAmount} 
                onChange={e => setFormData({ ...formData, ginsAmount: e.target.value })} 
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="otherAmount" className="text-xs uppercase font-bold text-muted-foreground">Other Amount (Rs.)</Label>
              <Input 
                id="otherAmount" 
                type="number" 
                className="bg-muted/10 border-border/50 h-10 font-mono" 
                value={formData.otherAmount} 
                onChange={e => setFormData({ ...formData, otherAmount: e.target.value })} 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-white/5">
            <div className="space-y-1">
              <Label htmlFor="totalDisbursement" className="text-xs uppercase font-bold text-purple-400">Total Disbursement (Rs.)</Label>
              <Input 
                id="totalDisbursement" 
                type="number" 
                readOnly 
                disabled 
                className="bg-purple-500/5 border-purple-500/20 h-10 font-mono text-purple-400 font-bold opacity-80" 
                value={formData.totalDisbursement} 
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="refCareOf" className="text-xs uppercase font-bold text-muted-foreground">Reference / Care of</Label>
              <Input 
                id="refCareOf" 
                placeholder="Reference or C/O..." 
                className="bg-muted/10 border-border/50 h-10" 
                value={formData.refCareOf} 
                onChange={e => setFormData({ ...formData, refCareOf: e.target.value })} 
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs uppercase font-bold text-muted-foreground">Bank Status</Label>
              <Select value={formData.bankStatus} onValueChange={v => setFormData({ ...formData, bankStatus: v })}>
                <SelectTrigger className="bg-muted/10 border-border/50 h-10 font-medium">
                  <SelectValue placeholder="Bank Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">PENDING</SelectItem>
                  <SelectItem value="PAID">PAID</SelectItem>
                  <SelectItem value="DEPOSITED">DEPOSITED</SelectItem>
                  <SelectItem value="RETURNED">RETURNED</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* History of Claims & Disbursements */}
      {employeeHistory.length > 0 && (
        <Card className="glass-card overflow-hidden border-none shadow-md w-full animate-slide-in">
          <div className="h-2 bg-indigo-500" />
          <CardHeader className="py-4 px-6 border-b border-white/5 flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2 font-heading tracking-wide">
              <Wallet className="w-5 h-5 text-indigo-400" /> 
              History of Received Items (Claims & Disbursements)
            </CardTitle>
            <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 rounded-full text-xs font-bold font-mono">
              {employeeHistory.length} Record(s) Found
            </span>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30 border-b border-border/50 whitespace-nowrap">
                  <TableRow>
                    <TableHead className="pl-6 uppercase text-[10px] font-bold">Tab / Month</TableHead>
                    <TableHead className="uppercase text-[10px] font-bold">Nature of Bill</TableHead>
                    <TableHead className="uppercase text-[10px] font-bold text-blue-400">Fund</TableHead>
                    <TableHead className="uppercase text-[10px] font-bold text-blue-400">Sal</TableHead>
                    <TableHead className="uppercase text-[10px] font-bold text-blue-400">Pen/Grat</TableHead>
                    <TableHead className="uppercase text-[10px] font-bold text-blue-400">LPR</TableHead>
                    <TableHead className="uppercase text-[10px] font-bold text-blue-400">Disb</TableHead>
                    <TableHead className="uppercase text-[10px] font-bold text-blue-400">Med</TableHead>
                    <TableHead className="uppercase text-[10px] font-bold text-blue-400">G.Ins</TableHead>
                    <TableHead className="uppercase text-[10px] font-bold text-emerald-400">Total (Rs.)</TableHead>
                    <TableHead className="uppercase text-[10px] font-bold text-center">Date</TableHead>
                    <TableHead className="uppercase text-[10px] font-bold">Cheque No</TableHead>
                    <TableHead className="uppercase text-[10px] font-bold">Status</TableHead>
                    <TableHead className="text-right pr-6 uppercase text-[10px] font-bold">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employeeHistory.map((item, idx) => {
                    const dateToShow = item.passing_date || item.payment_date || item.disbursed_date;
                    const amountToShow = item.total_amount || item.cheque_amount || item.total_disbursement;

                    const getTabBadgeColor = (tabName: string) => {
                      if (!tabName) return "bg-gray-500/20 text-gray-400";
                      const t = tabName.toUpperCase();
                      if (t.includes("CP.FUND") || t.includes("F.C")) return "bg-blue-500/20 text-blue-400";
                      if (t.includes("L.P.R")) return "bg-amber-500/20 text-amber-400";
                      if (t.includes("PEN")) return "bg-purple-500/20 text-purple-400";
                      if (t.includes("DISBURSEMENT") || t.includes("DISB")) return "bg-emerald-500/20 text-emerald-400";
                      if (t.includes("SALARY")) return "bg-pink-500/20 text-pink-400";
                      return "bg-indigo-500/20 text-indigo-400";
                    };

                    return (
                      <TableRow key={item.id || idx} className="hover:bg-white/5 transition-colors border-b border-white/5 whitespace-nowrap">
                        <TableCell className="pl-6 font-medium">
                          <span className={`px-2.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-tighter ${getTabBadgeColor(item.source_tab)}`}>
                            {item.source_tab || "UNIFIED"}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs max-w-[150px] truncate" title={item.nature_of_bill || item.bank_details || "N/A"}>
                          {item.nature_of_bill || item.bank_details || "---"}
                        </TableCell>
                        <TableCell className="font-mono text-[11px]">{item.fund_amount > 0 ? item.fund_amount.toLocaleString() : '-'}</TableCell>
                        <TableCell className="font-mono text-[11px]">{item.sal_amount > 0 ? item.sal_amount.toLocaleString() : '-'}</TableCell>
                        <TableCell className="font-mono text-[11px]">{item.pen_amount > 0 ? item.pen_amount.toLocaleString() : '-'}</TableCell>
                        <TableCell className="font-mono text-[11px]">{item.lpr_amount > 0 ? item.lpr_amount.toLocaleString() : '-'}</TableCell>
                        <TableCell className="font-mono text-[11px]">{item.disb_amount > 0 ? item.disb_amount.toLocaleString() : '-'}</TableCell>
                        <TableCell className="font-mono text-[11px]">{item.med_amount > 0 ? item.med_amount.toLocaleString() : '-'}</TableCell>
                        <TableCell className="font-mono text-[11px]">{item.gins_amount > 0 ? item.gins_amount.toLocaleString() : '-'}</TableCell>
                        <TableCell className="font-mono text-xs font-bold text-emerald-400">
                          Rs. {amountToShow?.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-center font-mono text-xs">
                          {formatDateDisplay(dateToShow)}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {item.cheque_no || "---"}
                        </TableCell>
                        <TableCell>
                          <span className={`flex items-center gap-1 text-[10px] font-bold uppercase ${item.status === 'active' || item.bank_status?.toUpperCase() === 'DEPOSITED' ? 'text-emerald-500' : 'text-rose-500'}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${item.status === 'active' || item.bank_status?.toUpperCase() === 'DEPOSITED' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                            {item.bank_status || item.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setSelectedViewRecord(item)}>
                            <Eye className="w-3.5 h-3.5 text-muted-foreground hover:text-primary transition-colors" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}


      {/* Grid List Bottom */}
      <Card className="glass-card overflow-hidden border-none shadow-md mt-6">
        <div className="h-2 bg-indigo-500/50" />
        <CardHeader className="flex flex-row items-center justify-between py-4 bg-muted/10">
          <CardTitle className="text-lg flex items-center gap-2 font-heading">
            <Users className="w-5 h-5 text-indigo-400" /> Recent Employee Entries
          </CardTitle>
          <div className="relative w-72">
             <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
             <Input 
               placeholder="Search database for staff..." 
               className="pl-9 bg-background/50 border-border/50 h-9 text-xs focus-visible:ring-indigo-500" 
               value={bottomSearch}
               onChange={e => setBottomSearch(e.target.value)}
             />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30 border-b border-border/50">
                <TableRow>
                  <TableHead className="w-20 pl-6 uppercase text-[10px] font-bold">Category</TableHead>
                  <TableHead className="uppercase text-[10px] font-bold">Emp/Pen No</TableHead>
                  <TableHead className="uppercase text-[10px] font-bold">Full Name</TableHead>
                  <TableHead className="uppercase text-[10px] font-bold">Amount (Rs.)</TableHead>
                  <TableHead className="uppercase text-[10px] font-bold">Status</TableHead>
                  <TableHead className="text-right pr-6 uppercase text-[10px] font-bold">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.length > 0 ? (
                  records.map((r) => (
                    <TableRow key={r.id} className="hover:bg-white/5 transition-colors border-b border-white/5">
                      <TableCell className="pl-6 font-medium">
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-tighter ${r.category === 'Employed' ? 'bg-blue-500/20 text-blue-400' : 'bg-rose-500/20 text-rose-400'}`}>
                          {r.category}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{r.employee_no || r.pension_no}</TableCell>
                      <TableCell className="text-sm">{r.full_name}</TableCell>
                      <TableCell className="font-mono text-sm font-bold text-emerald-400">{r.total_amount?.toLocaleString()}</TableCell>
                      <TableCell>
                        <span className={`flex items-center gap-1.5 text-[10px] font-bold ${r.status === 'active' ? 'text-emerald-500' : 'text-rose-500'}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${r.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          {r.status?.toUpperCase()}
                        </span>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setSelectedViewRecord(r)}>
                           <Eye className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground italic text-sm font-sans">No records found in unified database</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Detailed View Dialog */}
      <Dialog open={!!selectedViewRecord} onOpenChange={(open) => !open && setSelectedViewRecord(null)}>
        <DialogContent className="sm:max-w-3xl bg-card border-none glass-card shadow-2xl backdrop-blur-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b border-white/5 pb-4">
            <DialogTitle className="text-xl font-bold flex items-center gap-3 font-heading">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                 <User className="w-6 h-6 text-primary" />
              </div>
              Record # {selectedViewRecord?.serial_no || "Auto"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6 p-4">
            <div className="space-y-4">
               <div className="w-full aspect-square rounded-xl border border-white/10 overflow-hidden bg-white/5">
                  {selectedViewRecord?.photo_url ? (
                    <img src={selectedViewRecord.photo_url} alt="Staff" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center flex-col gap-2 text-muted-foreground/40">
                       <ImageIcon className="w-12 h-12" />
                       <span className="text-[10px] font-bold uppercase tracking-widest">No Photo Available</span>
                    </div>
                  )}
               </div>
               <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                  <span className="text-[10px] uppercase font-bold text-primary/60 block mb-1">Categorization</span>
                  <div className="flex gap-2">
                    <span className="px-2 py-0.5 bg-black/40 rounded text-[10px] font-bold uppercase">{selectedViewRecord?.category}</span>
                    <span className="px-2 py-0.5 bg-black/40 rounded text-[10px] font-bold uppercase">
                      {getSubCatLabel(selectedViewRecord?.sub_category_regular || selectedViewRecord?.sub_category_retired)}
                    </span>
                  </div>
               </div>
            </div>

            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-0.5 text-xs">
                  <span className="text-muted-foreground font-medium uppercase tracking-tighter">Staff Name</span>
                  <p className="font-bold text-base truncate">{selectedViewRecord?.full_name}</p>
                </div>
                <div className="space-y-0.5 text-xs">
                  <span className="text-muted-foreground font-medium uppercase tracking-tighter">CNIC Number</span>
                  <p className="font-mono font-bold">{selectedViewRecord?.cnic_no || "---"}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/5 font-sans">
                <div>
                   <span className="text-[10px] uppercase font-bold text-muted-foreground opacity-60">Employee No</span>
                   <p className="font-bold font-mono">{selectedViewRecord?.employee_no || "N/A"}</p>
                </div>
                <div>
                   <span className="text-[10px] uppercase font-bold text-muted-foreground opacity-60">Pension No</span>
                   <p className="font-bold font-mono">{selectedViewRecord?.pension_no || "N/A"}</p>
                </div>
              </div>

              <div className="space-y-1 pt-2 border-t border-white/5">
                <span className="text-[10px] uppercase font-bold text-muted-foreground opacity-60">Bank Account / Payment Record</span>
                <p className="font-semibold text-blue-400 bg-blue-500/5 p-2 rounded border border-blue-500/10 text-xs italic">{selectedViewRecord?.bank_details || "No details provided"}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/5">
                 <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground opacity-60">Appointment</span>
                    <p className="font-bold font-mono text-xs">{selectedViewRecord?.appointment_date || "N/A"}</p>
                 </div>
                 <div>
                    <span className="text-[10px] uppercase font-bold text-rose-500 opacity-60">Retired</span>
                    <p className="font-bold font-mono text-xs">{selectedViewRecord?.retired_date || "N/A"}</p>
                 </div>
              </div>

              {selectedViewRecord?.source_tab && (
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/5">
                   <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground opacity-60">Source Sheet/Tab</span>
                      <p className="font-bold text-indigo-400 uppercase text-xs">{selectedViewRecord?.source_tab}</p>
                   </div>
                   <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground opacity-60">Nature of Bill</span>
                      <p className="font-bold text-xs">{selectedViewRecord?.nature_of_bill || "---"}</p>
                   </div>
                </div>
              )}

              {selectedViewRecord?.cheque_no && (
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/5">
                   <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground opacity-60">Cheque Number</span>
                      <p className="font-mono font-bold text-blue-400">{selectedViewRecord?.cheque_no}</p>
                   </div>
                   <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground opacity-60">Cheque Date</span>
                      <p className="font-mono">{selectedViewRecord?.cheque_date || "---"}</p>
                   </div>
                </div>
              )}

              {(selectedViewRecord?.pmr_no || selectedViewRecord?.pmr_date || selectedViewRecord?.cheque_break_up) && (
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5">
                   <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground opacity-60">PMR Number</span>
                      <p className="font-mono font-bold text-xs">{selectedViewRecord?.pmr_no || "---"}</p>
                   </div>
                   <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground opacity-60">PMR Date</span>
                      <p className="font-mono text-xs">{selectedViewRecord?.pmr_date || "---"}</p>
                   </div>
                   <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground opacity-60">Cheque Break-up</span>
                      <p className="font-mono text-xs truncate" title={selectedViewRecord?.cheque_break_up}>{selectedViewRecord?.cheque_break_up || "---"}</p>
                   </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5">
                 <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground opacity-60">Passing Date</span>
                    <p className="font-mono text-xs">{selectedViewRecord?.passing_date || "---"}</p>
                 </div>
                 <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground opacity-60">Entry Date</span>
                    <p className="font-mono text-xs">{selectedViewRecord?.entry_date || "---"}</p>
                 </div>
                 <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground opacity-60">Payment Date</span>
                    <p className="font-mono text-xs">{selectedViewRecord?.payment_date || "---"}</p>
                 </div>
              </div>

              {(selectedViewRecord?.paid_amount > 0 || selectedViewRecord?.deduction > 0) && (
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/5 font-mono">
                   <div>
                      <span className="text-[10px] uppercase font-bold text-emerald-500 opacity-60">Paid Amount</span>
                      <p className="font-bold text-emerald-400">Rs.{selectedViewRecord?.paid_amount?.toLocaleString()}</p>
                   </div>
                   <div>
                      <span className="text-[10px] uppercase font-bold text-rose-500 opacity-60">Deduction</span>
                      <p className="font-bold text-rose-400">Rs.{selectedViewRecord?.deduction?.toLocaleString()}</p>
                   </div>
                </div>
              )}

              <div className="space-y-1 pt-2 border-t border-white/5">
                 <div className="flex justify-between items-end">
                    <div>
                       <span className="text-[10px] uppercase font-bold text-emerald-500">Total Approved</span>
                       <p className="text-xl font-bold font-mono">Rs.{selectedViewRecord?.total_amount?.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                       <span className="text-[10px] uppercase font-bold text-rose-500">Net Payable</span>
                       <p className="text-lg font-bold font-mono">Rs.{selectedViewRecord?.cheque_amount?.toLocaleString()}</p>
                    </div>
                 </div>
              </div>
            </div>
          </div>

          {/* Disbursement Breakdown Panel */}
          {(selectedViewRecord?.total_disbursement > 0 || 
            selectedViewRecord?.fund_amount > 0 || 
            selectedViewRecord?.sal_amount > 0 || 
            selectedViewRecord?.pen_amount > 0 || 
            selectedViewRecord?.lpr_amount > 0 || 
            selectedViewRecord?.disb_amount > 0 || 
            selectedViewRecord?.med_amount > 0 || 
            selectedViewRecord?.gins_amount > 0 || 
            selectedViewRecord?.other_amount > 0 ||
            selectedViewRecord?.ref_care_of || 
            selectedViewRecord?.bank_status) && (
            <div className="border-t border-white/5 p-4 space-y-3 bg-emerald-500/5 rounded-b-xl">
              <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5" /> Disbursement & Fund Breakdown
              </span>
              
              {selectedViewRecord?.ref_care_of && (
                <div className="bg-emerald-500/10 p-2 rounded border border-emerald-500/20 text-xs flex justify-between items-center">
                  <span className="text-muted-foreground">Reference / Care of:</span>
                  <span className="font-semibold text-white">{selectedViewRecord.ref_care_of}</span>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {selectedViewRecord?.fund_amount > 0 && (
                  <div className="p-2 bg-black/30 rounded border border-white/10">
                    <span className="text-[9px] uppercase font-medium text-muted-foreground block">Fund Amount</span>
                    <span className="font-mono font-bold text-white">Rs. {selectedViewRecord.fund_amount.toLocaleString()}</span>
                  </div>
                )}
                {selectedViewRecord?.sal_amount > 0 && (
                  <div className="p-2 bg-black/30 rounded border border-white/10">
                    <span className="text-[9px] uppercase font-medium text-muted-foreground block">Salary Amount</span>
                    <span className="font-mono font-bold text-white">Rs. {selectedViewRecord.sal_amount.toLocaleString()}</span>
                  </div>
                )}
                {selectedViewRecord?.pen_amount > 0 && (
                  <div className="p-2 bg-black/30 rounded border border-white/10">
                    <span className="text-[9px] uppercase font-medium text-muted-foreground block">Pension Amount</span>
                    <span className="font-mono font-bold text-white">Rs. {selectedViewRecord.pen_amount.toLocaleString()}</span>
                  </div>
                )}
                {selectedViewRecord?.lpr_amount > 0 && (
                  <div className="p-2 bg-black/30 rounded border border-white/10">
                    <span className="text-[9px] uppercase font-medium text-muted-foreground block">LPR Amount</span>
                    <span className="font-mono font-bold text-white">Rs. {selectedViewRecord.lpr_amount.toLocaleString()}</span>
                  </div>
                )}
                {selectedViewRecord?.disb_amount > 0 && (
                  <div className="p-2 bg-black/30 rounded border border-white/10">
                    <span className="text-[9px] uppercase font-medium text-muted-foreground block">Disbursed Amount</span>
                    <span className="font-mono font-bold text-white">Rs. {selectedViewRecord.disb_amount.toLocaleString()}</span>
                  </div>
                )}
                {selectedViewRecord?.med_amount > 0 && (
                  <div className="p-2 bg-black/30 rounded border border-white/10">
                    <span className="text-[9px] uppercase font-medium text-muted-foreground block">Medical Claim</span>
                    <span className="font-mono font-bold text-white">Rs. {selectedViewRecord.med_amount.toLocaleString()}</span>
                  </div>
                )}
                {selectedViewRecord?.gins_amount > 0 && (
                  <div className="p-2 bg-black/30 rounded border border-white/10">
                    <span className="text-[9px] uppercase font-medium text-muted-foreground block">Group Insurance</span>
                    <span className="font-mono font-bold text-white">Rs. {selectedViewRecord.gins_amount.toLocaleString()}</span>
                  </div>
                )}
                {selectedViewRecord?.other_amount > 0 && (
                  <div className="p-2 bg-black/30 rounded border border-white/10">
                    <span className="text-[9px] uppercase font-medium text-muted-foreground block">Other Amount</span>
                    <span className="font-mono font-bold text-white">Rs. {selectedViewRecord.other_amount.toLocaleString()}</span>
                  </div>
                )}
              </div>

              {(selectedViewRecord?.total_disbursement > 0 || selectedViewRecord?.bank_status) && (
                <div className="flex justify-between items-center p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs font-semibold">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Bank Status:</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      selectedViewRecord.bank_status?.toUpperCase() === 'PAID' || selectedViewRecord.bank_status?.toUpperCase() === 'CLOSE' 
                        ? 'bg-emerald-500/20 text-emerald-400' 
                        : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {selectedViewRecord.bank_status || "PENDING"}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-emerald-400 block">Total Disbursement</span>
                    <span className="text-sm font-bold font-mono text-white">Rs. {selectedViewRecord.total_disbursement.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
