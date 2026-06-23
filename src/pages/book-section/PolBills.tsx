import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Fuel, Search, Save, RotateCcw, Trash2, User, Truck, Calendar, Loader2, Settings } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function PolBills() {
  const navigate = useNavigate();
  const location = useLocation();
  const navState = location.state as any;
  
  // Records State
  const [records, setRecords] = useState<any[]>([]);
  
  // Form States
  const [empNo, setEmpNo] = useState("");
  const [vehicleNo, setVehicleNo] = useState("");
  const [officerName, setOfficerName] = useState("");
  const [designation, setDesignation] = useState("");
  const [department, setDepartment] = useState("");
  const [poiBill, setPoiBill] = useState("");
  
  const [polPrevious, setPolPrevious] = useState("0");
  const [polCurrent, setPolCurrent] = useState("0");
  const [psoRate, setPsoRate] = useState("0");
  const [month, setMonth] = useState("");
  const [fuelType, setFuelType] = useState("");
  const [grossAmount, setGrossAmount] = useState("0");
  const [fuelStations, setFuelStations] = useState("");
  const [trackingId, setTrackingId] = useState<string | null>(null);
  
  // Custom Fields State
  const [customFields, setCustomFields] = useState<any[]>([]);
  const [customData, setCustomData] = useState<Record<string, any>>({});
  
  const fetchFields = async () => {
    try {
      const { data } = await supabase.from('pol_bills_custom_fields' as any).select('*').order('created_at', { ascending: true });
      if (data) setCustomFields(data);
    } catch (err) {}
  };
  
  const fetchRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('pol_billings' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
        
      if (error) throw error;
      if (data) setRecords(data);
    } catch (err) {
      console.error("Error fetching POL records:", err);
    }
  };

  useEffect(() => {
    fetchRecords();
    fetchFields();

    // Check if data is coming from Bill Dispatch (navState)
    if (navState) {
        if (navState.vendorName || navState.contractorName) setOfficerName(navState.vendorName || navState.contractorName);
        if (navState.grossAmount) setGrossAmount(navState.grossAmount.toString());
        if (navState.voucherNo) setPoiBill(navState.voucherNo);
        if (navState.partyCode) setEmpNo(navState.partyCode);
        if (navState.trackingId) setTrackingId(navState.trackingId);
        toast.success("Data imported from Bill Dispatch");
        // Clear history state
        window.history.replaceState({}, document.title);
    }
  }, [navState]);

  const [vendorType, setVendorType] = useState("pol_bills");

  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState("emp");
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleReset = (silent = false) => {
    setEmpNo("");
    setVehicleNo("");
    setOfficerName("");
    setDesignation("");
    setDepartment("");
    setPoiBill("");
    setPolPrevious("0");
    setPolCurrent("0");
    setPsoRate("0");
    setMonth("");
    setFuelType("");
    setGrossAmount("0");
    setFuelStations("");
    setVendorType("pol_bills");
    setCustomData({});
    setErrors({});
    if (!silent) toast.info("Form reset successfully.");
  };

  const handleSave = async () => {
    const newErrors: Record<string, string> = {};
    if (!vehicleNo.trim()) newErrors.vehicleNo = "Vehicle No is required";
    
    if (!officerName.trim()) {
      newErrors.officerName = "Officer Name is required";
    } else if (/\d/.test(officerName)) {
      newErrors.officerName = "Numbers are not allowed in Officer Name";
    }

    if (department.trim() && /\d/.test(department)) {
      newErrors.department = "Numbers are not allowed in Department";
    }

    if (!poiBill.trim()) newErrors.poiBill = "POI Bill No is required";
    if (!month) newErrors.month = "Month is required";
    if (!fuelType) newErrors.fuelType = "Please select Fuel Type";
    if (!grossAmount || parseFloat(grossAmount) <= 0) newErrors.grossAmount = "Amount must be greater than 0";
    
    // Validate custom fields
    customFields.forEach(field => {
      if (field.is_required && !customData[field.field_name]) {
        newErrors[field.field_name] = `${field.field_name} is required`;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error(`${Object.keys(newErrors).length} required field(s) incomplete or invalid!`);
      return;
    }
    setErrors({});

    setIsSaving(true);
    try {
      const { error } = await supabase.from('pol_billings' as any).insert({
        emp_no: empNo,
        vehicle_no: vehicleNo,
        officer_name: officerName,
        designation: designation,
        department: department,
        poi_bill_no: poiBill,
        pol_previous: parseFloat(polPrevious) || 0,
        pol_current: parseFloat(polCurrent) || 0,
        pso_rate: parseFloat(psoRate) || 0,
        month_date: month || null,
        fuel_type: fuelType,
        gross_amount: parseFloat(grossAmount) || 0,
        fuel_stations: fuelStations,
        vendor_type: vendorType,
        custom_data: customData
      });

      if (error) throw error;
      toast.success("POL record saved to database!");
      await fetchRecords(); // Refresh the grid
      handleReset(true);
      setTimeout(() => {
        toast.info("Redirecting to Cheque Entries...");
        navigate('/book-section/cheque-record', { 
          state: { 
            empName: officerName, 
            empNo: empNo, 
            pensionNo: "",
            empStatus: "pol_bills",
            totalAmount: grossAmount,
            remainingBalance: "0"
          } 
        });
      }, 1500);
    } catch (err: any) {
      toast.error("Error saving POL record: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery) return toast.warning("Please enter a search query!");
    
    setIsSearching(true);
    try {
      // CFO Diary Number search - file_tracking_records se fetch karo
      if (searchType === 'cfo_diary') {
        const { data, error } = await supabase
          .from('file_tracking_records' as any)
          .select('*')
          .eq('cfo_diary_number', searchQuery)
          .maybeSingle();

        if (error) throw error;

        const ftRecord = data as any;
        if (ftRecord) {
          // File Tracking record se POL Bills form auto-fill
          setEmpNo(ftRecord.employee_number || "");
          setVehicleNo(ftRecord.vehicle_no || "");
          setOfficerName(ftRecord.received_from || "");
          setDepartment(ftRecord.sub_category || "");
          setPoiBill(ftRecord.cfo_diary_number || "");
          setGrossAmount(ftRecord.amount?.toString() || "0");
          setTrackingId(ftRecord.tracking_id || null);
          // CFO Diary se milne wala subject department field mein
          if (ftRecord.subject) setDesignation(ftRecord.subject);
          toast.success(`CFO Diary record found! Form auto-filled from File Tracking.`);
        } else {
          toast.error("No File Tracking record found with this CFO Diary Number.");
        }
        return;
      }

      // POL Billings table search (emp / pol / vehicle)
      let query: any = supabase.from('pol_billings' as any).select('*');
      
      if (searchType === 'emp') query = query.eq('emp_no', searchQuery);
      else if (searchType === 'pol') query = query.eq('poi_bill_no', searchQuery);
      else if (searchType === 'vehicle') query = query.eq('vehicle_no', searchQuery);

      const { data, error } = await query.maybeSingle();

      if (error) throw error;
      
      const record = data as any;
      if (record) {
        setEmpNo(record.emp_no || "");
        setVehicleNo(record.vehicle_no || "");
        setOfficerName(record.officer_name || "");
        setDesignation(record.designation || "");
        setDepartment(record.department || "");
        setPoiBill(record.poi_bill_no || "");
        setPolPrevious(record.pol_previous?.toString() || "0");
        setPolCurrent(record.pol_current?.toString() || "0");
        setPsoRate(record.pso_rate?.toString() || "0");
        setMonth(record.month_date || "");
        setFuelType(record.fuel_type || "");
        setGrossAmount(record.gross_amount?.toString() || "0");
        setFuelStations(record.fuel_stations || "");
        setVendorType(record.vendor_type || "pol_bills");
        setCustomData(record.custom_data || {});
        toast.success("POL record found!");
      } else {
        toast.error("No POL record found.");
      }
    } catch (err: any) {
      toast.error("Search error: " + err.message);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-10 animate-fade-in pb-20 pt-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border/10 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">POL Billings</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage fuel, oil, and lubricant related expenses with precision</p>
          {trackingId && (
            <div className="mt-2 flex items-center gap-2">
               <span className="text-[10px] font-bold bg-primary/20 text-primary px-2 py-0.5 rounded-md border border-primary/20 uppercase tracking-widest">Tracking: {trackingId}</span>
               <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 text-[10px] gap-1 hover:text-primary p-0 text-muted-foreground uppercase"
                onClick={() => navigate('/book-section/file-tracking', { state: { bill: { tracking_id: trackingId, diary_no: poiBill, party_name: officerName } } })}
               >
                 <Search className="w-3 h-3" /> Journey
                </Button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => handleReset()} className="gap-2 h-9 px-4">
            <RotateCcw className="w-4 h-4" /> Reset Form
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isSaving} className="gap-2 h-9 px-5 bg-primary shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} 
            Save Entry
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Form Area */}
        <div className="lg:col-span-3 space-y-8">
          <div className="grid grid-cols-1 gap-8 items-start">
            
            {/* Officer & Vehicle Info */}
            <Card className="glass-card overflow-hidden border-none shadow-xl">
              <div className="h-2 bg-primary" />
              <CardHeader className="pb-2">
                <CardTitle className="text-xl flex items-center gap-2">
                  <User className="w-6 h-6 text-primary" />
                  Staff & Vehicle Identification
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="empNo">Employee No</Label>
                    <Input id="empNo" value={empNo} onChange={(e) => setEmpNo(e.target.value)} className={`bg-muted/20 border-border/50 h-10 font-mono${errors.empNo ? ' border-red-500' : ''}`} />
                    {errors.empNo && <p className="text-xs text-red-400 mt-1">{errors.empNo}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vehicleNo">Vehicle No <span className="text-red-400">*</span></Label>
                    <Input id="vehicleNo" value={vehicleNo} onChange={(e) => setVehicleNo(e.target.value)} className={`bg-muted/20 border-border/50 h-10 font-mono${errors.vehicleNo ? ' border-red-500' : ''}`} />
                    {errors.vehicleNo && <p className="text-xs text-red-400 mt-1">{errors.vehicleNo}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="poiBill">POI Bill No <span className="text-red-400">*</span></Label>
                    <Input id="poiBill" value={poiBill} onChange={(e) => setPoiBill(e.target.value)} className={`bg-muted/20 border-border/50 h-10 font-mono${errors.poiBill ? ' border-red-500' : ''}`} />
                    {errors.poiBill && <p className="text-xs text-red-400 mt-1">{errors.poiBill}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <div className="space-y-2">
                      <Label htmlFor="officerName">Officer Name <span className="text-red-400">*</span></Label>
                      <Input id="officerName" value={officerName} onChange={(e) => setOfficerName(e.target.value)} className={`bg-muted/20 border-border/50 h-10${errors.officerName ? ' border-red-500' : ''}`} />
                      {errors.officerName && <p className="text-xs text-red-400 mt-1">{errors.officerName}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="designation">Designation</Label>
                      <Input id="designation" value={designation} onChange={(e) => setDesignation(e.target.value)} className="bg-muted/20 border-border/50 h-10" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="department">Department</Label>
                      <Input id="department" value={department} onChange={(e) => setDepartment(e.target.value)} className={`bg-muted/20 border-border/50 h-10${errors.department ? ' border-red-500' : ''}`} />
                      {errors.department && <p className="text-xs text-red-400 mt-1">{errors.department}</p>}
                    </div>
                </div>
              </CardContent>
            </Card>

            {/* Fuel Consumption */}
            <Card className="glass-card overflow-hidden border-none shadow-xl">
              <div className="h-2 bg-blue-500/50" />
              <CardHeader className="pb-2">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Fuel className="w-6 h-6 text-blue-400" />
                  Fuel Consumption Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-8 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                  <div className="space-y-2">
                    <Label htmlFor="previous" className="text-xs uppercase font-bold text-muted-foreground">POL Previous</Label>
                    <Input id="previous" type="number" value={polPrevious} onChange={(e) => setPolPrevious(e.target.value)} className="bg-muted/10 border-border/40 h-10 font-mono" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="current" className="text-xs uppercase font-bold text-muted-foreground">POL Current</Label>
                    <Input id="current" type="number" value={polCurrent} onChange={(e) => setPolCurrent(e.target.value)} className="bg-muted/10 border-border/40 h-10 font-mono" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rate" className="text-xs uppercase font-bold text-muted-foreground">PSO Rate</Label>
                    <Input id="rate" type="number" value={psoRate} onChange={(e) => setPsoRate(e.target.value)} className="bg-muted/10 border-border/40 h-10 font-mono" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="month" className="text-xs uppercase font-bold text-muted-foreground">Month</Label>
                    <Input id="month" type="date" value={month} onChange={(e) => setMonth(e.target.value)} className="bg-muted/10 border-border/40 h-10 font-mono" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="space-y-2">
                     <Label className="text-xs uppercase font-bold text-muted-foreground">Fuel Type</Label>
                     <Select value={fuelType} onValueChange={setFuelType}>
                       <SelectTrigger className="bg-muted/10 border-border/40 h-10">
                         <SelectValue placeholder="Select Fuel Type" />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="petrol">Petrol</SelectItem>
                         <SelectItem value="diesel">Diesel</SelectItem>
                       </SelectContent>
                     </Select>
                  </div>
                  <div className="space-y-2 font-bold">
                      <Label className="text-xs uppercase font-bold text-primary">Gross Amount</Label>
                      <Input type="number" value={grossAmount} onChange={(e) => setGrossAmount(e.target.value)} className="bg-primary/5 border-primary/20 h-10 font-mono text-primary font-bold text-lg" />
                   </div>
                   <div className="space-y-2">
                      <Label htmlFor="stations" className="text-xs uppercase font-bold text-muted-foreground">Fuel Stations</Label>
                      <Input id="stations" value={fuelStations} onChange={(e) => setFuelStations(e.target.value)} className="bg-muted/10 border-border/40 h-10" />
                   </div>
                </div>
              </CardContent>
            </Card>

            {/* Dynamic Custom Fields */}
            {customFields.length > 0 && (
              <Card className="glass-card overflow-hidden border-none shadow-xl">
                <div className="h-2 bg-purple-500/50" />
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Settings className="w-6 h-6 text-purple-400" />
                    Additional Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {customFields.map((field) => (
                      <div className="space-y-2" key={field.id}>
                        <Label>
                          {field.field_name} {field.is_required && <span className="text-red-400">*</span>}
                        </Label>
                        <Input 
                          type={field.field_type === 'date' ? 'date' : field.field_type === 'number' ? 'number' : 'text'}
                          value={customData[field.field_name] || ""}
                          onChange={(e) => setCustomData({...customData, [field.field_name]: e.target.value})}
                          className={`bg-muted/10 border-border/40 h-10${errors[field.field_name] ? ' border-red-500' : ''}`}
                        />
                        {errors[field.field_name] && <p className="text-xs text-red-400 mt-1">{errors[field.field_name]}</p>}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Sidebar Mini Column */}
        <div className="space-y-6 flex flex-col">
          {/* Vendor Identification */}
          <Card className="glass-card overflow-hidden border-none shadow-md">
            <div className="h-1 bg-black" />
            <CardHeader className="py-4">
              <CardTitle className="text-xs font-bold flex items-center gap-2 uppercase tracking-wider">
                <Truck className="w-4 h-4 text-primary" />
                Vendor Type
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-6">
              <Select value={vendorType} onValueChange={setVendorType}>
                <SelectTrigger className="bg-muted/10 border-border/50 h-9 text-xs">
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
            </CardContent>
          </Card>
          
          {/* Quick Search */}
          <Card className="glass-card overflow-hidden border-none shadow-md bg-primary/5">
            <div className="h-1 bg-primary/40" />
            <CardHeader className="py-4">
              <CardTitle className="text-xs font-bold flex items-center gap-2 text-primary uppercase tracking-wider">
                <Search className="w-4 h-4" />
                Quick Search
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pb-6">
              <div className="space-y-1.5">
                <Label className="text-[10px] text-muted-foreground font-semibold uppercase">Search Value</Label>
                <Input 
                   placeholder={searchType === 'cfo_diary' ? "e.g. CFO-2025-0012" : "Enter ID..."}
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                   className={`bg-background/50 text-xs h-8 font-mono ${searchType === 'cfo_diary' ? 'border-primary/60 ring-1 ring-primary/20' : 'border-border/50'}`}
                />
                {searchType === 'cfo_diary' && (
                  <p className="text-[9px] text-primary/70 italic">File Tracking se auto-fill hoga</p>
                )}
              </div>
              <div className="space-y-1.5 pt-1">
                <Label className="text-[10px] text-muted-foreground font-semibold uppercase">Filter By</Label>
                <RadioGroup value={searchType} onValueChange={setSearchType} className="space-y-1.5">
                  <div className="flex items-center gap-2 px-1">
                    <RadioGroupItem value="emp" id="q-emp" className="w-3 h-3 border-primary" />
                    <Label htmlFor="q-emp" className="text-[10px] font-medium text-muted-foreground/80 cursor-pointer">Employee No</Label>
                  </div>
                  <div className="flex items-center gap-2 px-1">
                    <RadioGroupItem value="pol" id="q-pol" className="w-3 h-3 border-primary" />
                    <Label htmlFor="q-pol" className="text-[10px] font-medium text-muted-foreground/80 cursor-pointer">POI Bill No</Label>
                  </div>
                  <div className="flex items-center gap-2 px-1">
                    <RadioGroupItem value="vehicle" id="q-vehicle" className="w-3 h-3 border-primary" />
                    <Label htmlFor="q-vehicle" className="text-[10px] font-medium text-muted-foreground/80 cursor-pointer">Vehicle No</Label>
                  </div>
                  <div className="flex items-center gap-2 px-1">
                    <RadioGroupItem value="cfo_diary" id="q-cfo-diary" className="w-3 h-3 border-primary" />
                    <Label htmlFor="q-cfo-diary" className="text-[10px] font-medium text-primary/90 cursor-pointer font-bold">CFO Diary No ✦</Label>
                  </div>
                </RadioGroup>
              </div>
              <Button 
                 onClick={handleSearch} 
                 disabled={isSearching}
                 size="sm"
                 className="w-full h-8 text-[10px] font-bold bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 mt-2"
              >
                 {isSearching ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Search className="w-3 h-3 mr-2" />}
                 FETCH DATA
              </Button>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="glass-card border-none bg-muted/20 shadow-sm mt-auto">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-muted-foreground/60 border-b border-border/50 pb-2 mb-2">
                <Calendar className="w-3 h-3" /> System Actions
              </div>
              <Button variant="outline" size="sm" onClick={() => handleReset()} className="w-full text-[10px] h-7 border-border/50 text-rose-400 hover:text-rose-300 bg-transparent">
                <RotateCcw className="w-3 h-3 mr-1" /> Clear Everything
              </Button>
              <Button variant="destructive" size="sm" className="w-full gap-2 text-[10px] h-7 font-bold uppercase tracking-tight">
                <Trash2 className="w-3 h-3" /> Delete Record
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Records Table */}
      <Card className="glass-card overflow-hidden border-none shadow-md mt-6">
        <div className="h-2 bg-primary/50" />
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Fuel className="w-5 h-5 text-primary" />
            Recent POL Records
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border/50 overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>POI Bill No</TableHead>
                  <TableHead>Emp No</TableHead>
                  <TableHead>Officer Name</TableHead>
                  <TableHead>Vehicle No</TableHead>
                  <TableHead>Gross Amount</TableHead>
                  <TableHead>Month</TableHead>
                  <TableHead>Stations</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.length > 0 ? (
                  records.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium font-mono">{r.poi_bill_no}</TableCell>
                      <TableCell className="font-mono text-xs">{r.emp_no}</TableCell>
                      <TableCell className="font-semibold">{r.officer_name}</TableCell>
                      <TableCell className="font-mono text-xs">{r.vehicle_no}</TableCell>
                      <TableCell className="font-mono text-xs italic font-bold text-primary">{r.gross_amount}</TableCell>
                      <TableCell>{r.month_date || 'N/A'}</TableCell>
                      <TableCell className="max-w-[150px] truncate">{r.fuel_stations}</TableCell>
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
