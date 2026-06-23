import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Eye, Users, FileText, Download, Wallet, ArrowUpDown, ChevronLeft, ChevronRight, X, Info, Calendar, CreditCard, TrendingUp, Hash, Banknote, ChevronDown, ChevronUp, Filter, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";

// Format dates nicely
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

// Map subcategory values to readable labels
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
    'financial-assistance': 'Financial Assistance',
    'daily-wages': 'Daily Wages',
    'daily_wages': 'Daily Wages'
  };
  return mapping[val] || val;
};

// Head defs for summary
const HEAD_DEFS = [
  { id: "CP.FUND",        label: "CP Fund",          color: "text-blue-400" },
  { id: "L.P.R",          label: "LPR",              color: "text-amber-400" },
  { id: "PEN",            label: "Pension/Grat",     color: "text-purple-400" },
  { id: "F.A",            label: "Fin. Assist.",     color: "text-rose-400" },
  { id: "G.I",            label: "Group Ins.",       color: "text-rose-400" },
  { id: "F.C",            label: "Funds (FC)",       color: "text-blue-400" },
  { id: "S.SALARY",       label: "Supp. Salary",     color: "text-pink-400" },
  { id: "C.SALARY",       label: "Cont. Salary",     color: "text-pink-400" },
  { id: "T.A.D.A",        label: "TADA",             color: "text-sky-400" },
  { id: "O.T",            label: "Overtime",         color: "text-sky-400" },
  { id: "H.B.L",          label: "House Building",   color: "text-amber-400" },
  { id: "M.M.L",          label: "Moto Loan",        color: "text-amber-400" },
  { id: "MED",            label: "Medical",          color: "text-rose-400" },
  { id: "DISB",           label: "Disbursements",    color: "text-emerald-400" },
];

const parseTabToDate = (tab: string) => {
  const cleaned = tab.replace(/^DISB-/i, "").trim();
  const monthMap: Record<string,string> = { JAN:"Jan",FEB:"Feb",MAR:"Mar",APR:"Apr",MAY:"May",JUNE:"Jun",JUN:"Jun",JULY:"Jul",JUL:"Jul",AUG:"Aug",SEP:"Sep",OCT:"Oct",NOV:"Nov",DEC:"Dec" };
  const match = cleaned.match(/^([A-Z]+)\s*(\d{2,4})$/i);
  if (match) { const mon = monthMap[match[1].toUpperCase()] || match[1]; const yr = match[2].length === 2 ? "20" + match[2] : match[2]; return `${mon} ${yr}`; }
  return cleaned;
};

export default function AllEmployees() {
  const navigate = useNavigate();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTab, setSelectedTab] = useState("ALL");
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  // Preview Dialog states
  const [previewRecord, setPreviewRecord] = useState<any>(null);
  const [previewAllRecs, setPreviewAllRecs] = useState<any[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewActiveHead, setPreviewActiveHead] = useState<string | null>(null);
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [totalCount, setTotalCount] = useState(0);

  // Stats
  const [stats, setStats] = useState({
    totalAmount: 0,
    totalRecords: 0,
    regularCount: 0,
    retiredCount: 0
  });

  // Fetch stats from database
  const fetchStats = async () => {
    try {
      // Try to call the RPC function to get full aggregate stats across all rows
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('get_book_section_stats');

      if (!rpcError && rpcData) {
        setStats({
          totalAmount: Number(rpcData.total_amount) || 0,
          totalRecords: Number(rpcData.total_count) || 0,
          regularCount: Number(rpcData.regular_count) || 0,
          retiredCount: Number(rpcData.retired_count) || 0
        });
        return;
      }

      console.warn("RPC stats failed, falling back to basic query (limited to 1,000 rows):", rpcError?.message);

      // Fallback: Fetch counts and amounts (limited to first 1000 records)
      const { data, error } = await supabase
        .from('book_section_employees')
        .select('total_amount, category');

      if (error) throw error;

      if (data) {
        const totalAmt = data.reduce((acc, curr) => acc + (Number(curr.total_amount) || 0), 0);
        const regular = data.filter(r => r.category === 'Employed').length;
        const retired = data.filter(r => r.category === 'Retired').length;

        setStats({
          totalAmount: totalAmt,
          totalRecords: data.length,
          regularCount: regular,
          retiredCount: retired
        });
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  // Fetch paginated and filtered records
  const fetchRecords = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('book_section_employees')
        .select('*', { count: 'exact' });

      // Apply search filters
      if (searchTerm.trim() !== "") {
        const term = `%${searchTerm.trim()}%`;
        query = query.or(`employee_no.ilike.${term},pension_no.ilike.${term},full_name.ilike.${term},cnic_no.ilike.${term}`);
      }

      // Filter by Source Tab
      if (selectedTab !== "ALL") {
        query = query.eq('source_tab', selectedTab);
      }

      // Filter by Category
      if (selectedCategory !== "ALL") {
        query = query.eq('category', selectedCategory);
      }

      // Order and Paginate
      const start = (currentPage - 1) * pageSize;
      const end = start + pageSize - 1;

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(start, end);

      if (error) throw error;

      setRecords(data || []);
      setTotalCount(count || 0);
    } catch (err: any) {
      console.error("Error fetching database records:", err);
      toast.error("Failed to load records: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    setCurrentPage(1); // Reset page on filter change
    fetchRecords();
  }, [searchTerm, selectedTab, selectedCategory, pageSize]);

  useEffect(() => {
    fetchRecords();
  }, [currentPage]);



  // When previewRecord changes, fetch all related records
  useEffect(() => {
    if (!previewRecord) { setPreviewAllRecs([]); setPreviewActiveHead(null); setExpandedMonth(null); return; }
    const fetchPreviewRecs = async () => {
      setPreviewLoading(true);
      try {
        const conditions: string[] = [];
        if (previewRecord.employee_no?.trim()) conditions.push(`employee_no.eq.${previewRecord.employee_no}`);
        if (previewRecord.pension_no?.trim()) conditions.push(`pension_no.eq.${previewRecord.pension_no}`);
        if (previewRecord.full_name?.trim()) conditions.push(`full_name.eq.${previewRecord.full_name}`);
        const { data, error } = await supabase.from("book_section_employees").select("*")
          .or(conditions.length > 0 ? conditions.join(",") : `id.eq.${previewRecord.id}`)
          .order("passing_date", { ascending: false })
          .limit(10000);
        if (!error && data) setPreviewAllRecs(data);
      } catch (e) { console.error(e); }
      finally { setPreviewLoading(false); }
    };
    fetchPreviewRecs();
  }, [previewRecord]);

  // Helper: head totals for preview
  const getPreviewHeadTotal = (headId: string) => {
    const recs = previewAllRecs.filter(r => {
      const tab = r.source_tab?.toUpperCase() || "";
      if (headId === "DISB") return tab.startsWith("DISB-");
      return tab === headId;
    });
    return recs.reduce((s, r) => s + (Number(r.total_amount) || Number(r.cheque_amount) || Number(r.total_disbursement) || 0), 0);
  };

  // Filtered records for preview dialog
  const previewFiltered = previewActiveHead
    ? previewAllRecs.filter(r => {
        const tab = r.source_tab?.toUpperCase() || "";
        if (previewActiveHead === "DISB") return tab.startsWith("DISB-");
        return tab === previewActiveHead;
      })
    : previewAllRecs;

  // Group preview filtered records by month/tab
  const previewGrouped: Record<string, any[]> = {};
  for (const r of previewFiltered) {
    const tab = r.source_tab || "UNKNOWN";
    const key = tab.startsWith("DISB-") ? (parseTabToDate(tab) || tab) : tab;
    if (!previewGrouped[key]) previewGrouped[key] = [];
    previewGrouped[key].push(r);
  }

  // Export search results to CSV
  const handleExportCSV = async () => {
    try {
      toast.info("Preparing data for export...");
      let query = supabase.from('book_section_employees').select('*');

      if (searchTerm.trim() !== "") {
        const term = `%${searchTerm.trim()}%`;
        query = query.or(`employee_no.ilike.${term},pension_no.ilike.${term},full_name.ilike.${term},cnic_no.ilike.${term}`);
      }
      if (selectedTab !== "ALL") query = query.eq('source_tab', selectedTab);
      if (selectedCategory !== "ALL") query = query.eq('category', selectedCategory);

      const { data, error } = await query;
      if (error) throw error;

      if (!data || data.length === 0) {
        toast.warning("No records found to export.");
        return;
      }

      // Create CSV Headers and Rows
      const headers = [
        "Serial No", "Employee No", "Pension No", "Full Name", "CNIC No", 
        "Category", "Sub-Category", "Source Tab", "Nature of Bill", 
        "Cheque No", "Cheque Date", "Total Amount", "Paid Amount", 
        "Deduction", "Passing Date", "Bank Status"
      ];

      const csvRows = [
        headers.join(","),
        ...data.map(r => [
          `"${r.serial_no || ''}"`,
          `"${r.employee_no || ''}"`,
          `"${r.pension_no || ''}"`,
          `"${r.full_name?.replace(/"/g, '""') || ''}"`,
          `"${r.cnic_no || ''}"`,
          `"${r.category || ''}"`,
          `"${r.sub_category_regular || r.sub_category_retired || ''}"`,
          `"${r.source_tab || ''}"`,
          `"${r.nature_of_bill?.replace(/"/g, '""') || ''}"`,
          `"${r.cheque_no || ''}"`,
          `"${r.cheque_date || ''}"`,
          r.total_amount || 0,
          r.paid_amount || 0,
          r.deduction || 0,
          `"${r.passing_date || ''}"`,
          `"${r.bank_status || ''}"`
        ].join(","))
      ];

      const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `employee_records_search_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`Exported ${data.length} records to CSV!`);
    } catch (err: any) {
      toast.error("Export failed: " + err.message);
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  // Tab Badge colors helper
  const getTabBadgeColor = (tabName: string) => {
    if (!tabName) return "bg-gray-500/20 text-gray-400";
    const t = tabName.toUpperCase();
    if (t.includes("CP.FUND") || t.includes("F.C")) return "bg-blue-500/20 text-blue-400";
    if (t.includes("L.P.R") || t.includes("H.B.L") || t.includes("M.M.L")) return "bg-amber-500/20 text-amber-400";
    if (t.includes("PEN")) return "bg-purple-500/20 text-purple-400";
    if (t.includes("DISBURSEMENT") || t.includes("DISB")) return "bg-emerald-500/20 text-emerald-400";
    if (t.includes("SALARY")) return "bg-pink-500/20 text-pink-400";
    if (t.includes("T.A.D.A") || t.includes("O.T")) return "bg-sky-500/20 text-sky-400";
    if (t.includes("F.A") || t.includes("G.I") || t.includes("MED") || t.includes("HINDO")) return "bg-rose-500/20 text-rose-400";
    return "bg-indigo-500/20 text-indigo-400";
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10 font-sans">
      
      {/* Header and Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Unified Employee Database</h1>
          <p className="text-sm text-muted-foreground/80">Browse, search, filter and inspect claims history across all departments</p>
        </div>
        <Button onClick={handleExportCSV} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
          <Download className="w-4 h-4" /> Export Search Results
        </Button>
      </div>

      {/* Stats Counters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card border-none shadow-md overflow-hidden">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-muted-foreground">Total Database Records</span>
              <h3 className="text-2xl font-bold font-mono tracking-tight text-white">{stats.totalRecords.toLocaleString()}</h3>
            </div>
            <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center border border-indigo-500/20">
              <Users className="w-6 h-6 text-indigo-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card border-none shadow-md overflow-hidden">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-muted-foreground">Total Sanctioned Amount</span>
              <h3 className="text-2xl font-bold font-mono tracking-tight text-emerald-400">Rs. {stats.totalAmount.toLocaleString()}</h3>
            </div>
            <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20">
              <Wallet className="w-6 h-6 text-emerald-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card border-none shadow-md overflow-hidden">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-muted-foreground">Regular Staff Records</span>
              <h3 className="text-2xl font-bold font-mono tracking-tight text-blue-400">{stats.regularCount.toLocaleString()}</h3>
            </div>
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20">
              <FileText className="w-6 h-6 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card border-none shadow-md overflow-hidden">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-muted-foreground">Retired Staff Records</span>
              <h3 className="text-2xl font-bold font-mono tracking-tight text-purple-400">{stats.retiredCount.toLocaleString()}</h3>
            </div>
            <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center border border-purple-500/20">
              <Users className="w-6 h-6 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Panel */}
      <Card className="glass-card border-none shadow-md">
        <div className="h-1 bg-indigo-500/30" />
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            {/* General Search Input */}
            <div className="md:col-span-2 space-y-1">
              <Label className="text-xs font-bold uppercase tracking-tight text-indigo-400">Search Profile</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Enter Employee No, Pension No, CNIC, or Full Name..." 
                  className="pl-9 h-11 bg-background/50 border-border/50 text-sm focus-visible:ring-indigo-500" 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="space-y-1">
              <Label className="text-xs font-bold uppercase tracking-tight text-blue-400">Staff Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="h-11 bg-background/50 border-border/50">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Categories</SelectItem>
                  <SelectItem value="Employed">Regular Staff (Employed)</SelectItem>
                  <SelectItem value="Retired">Retired Staff (Pension)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Source Tab Filter */}
            <div className="space-y-1">
              <Label className="text-xs font-bold uppercase tracking-tight text-purple-400">Source Sheet / Tab</Label>
              <Select value={selectedTab} onValueChange={setSelectedTab}>
                <SelectTrigger className="h-11 bg-background/50 border-border/50 font-medium">
                  <SelectValue placeholder="All GIDs/Tabs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Sheets & Tabs</SelectItem>
                  <SelectItem value="CP.FUND">CP Fund (CP.FUND)</SelectItem>
                  <SelectItem value="L.P.R">LPR (L.P.R)</SelectItem>
                  <SelectItem value="PEN">Pension (PEN)</SelectItem>
                  <SelectItem value="F.A">Financial Assistance (F.A)</SelectItem>
                  <SelectItem value="G.I">Group Insurance (G.I)</SelectItem>
                  <SelectItem value="F.C">Funds / CP Fund (F.C)</SelectItem>
                  <SelectItem value="S.SALARY">Supplementary Salary (S.SALARY)</SelectItem>
                  <SelectItem value="C.SALARY">Contract Salary (C.SALARY)</SelectItem>
                  <SelectItem value="T.A.D.A">TADA (T.A.D.A)</SelectItem>
                  <SelectItem value="O.T">Overtime (O.T)</SelectItem>
                  <SelectItem value="H.B.L">House Building Loan (H.B.L)</SelectItem>
                  <SelectItem value="M.M.L">Motorcycle Loan (M.M.L)</SelectItem>
                  <SelectItem value="MED">Medical Claim (MED)</SelectItem>
                  <SelectItem value="HINDO FESTIVAL">Hindu Festival (HINDO FESTIVAL)</SelectItem>
                  <SelectItem value="DISBURSEMENTS">Disbursements (DISBURSEMENTS)</SelectItem>
                </SelectContent>
              </Select>
            </div>

          </div>
        </CardContent>
      </Card>

      {/* Main Table Card */}
      <Card className="glass-card border-none shadow-md overflow-hidden">
        <div className="h-2 bg-indigo-500" />
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/40 border-b border-border/50">
                <TableRow>
                  <TableHead className="pl-6 uppercase text-[10px] font-bold">Source/Tab</TableHead>
                  <TableHead className="uppercase text-[10px] font-bold">Emp/Pen No</TableHead>
                  <TableHead className="uppercase text-[10px] font-bold">Full Name</TableHead>
                  <TableHead className="uppercase text-[10px] font-bold">Sub-Category</TableHead>
                  <TableHead className="uppercase text-[10px] font-bold">Nature of Bill</TableHead>
                  <TableHead className="uppercase text-[10px] font-bold text-emerald-400">Total Amount</TableHead>
                  <TableHead className="uppercase text-[10px] font-bold text-center">Passing/Payment Date</TableHead>
                  <TableHead className="uppercase text-[10px] font-bold">Cheque No</TableHead>
                  <TableHead className="text-right pr-6 uppercase text-[10px] font-bold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-20">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                        <span className="text-xs text-muted-foreground/80 font-bold uppercase tracking-widest">Querying Unified Database...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : records.length > 0 ? (
                  records.map((r, idx) => {
                    const dateToShow = r.passing_date || r.payment_date || r.disbursed_date;
                    const amountToShow = r.total_amount || r.cheque_amount || r.total_disbursement;

                    return (
                      <TableRow key={r.id || idx} className="hover:bg-white/5 transition-colors border-b border-white/5">
                        <TableCell className="pl-6">
                          <span className={`px-2.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-tighter ${getTabBadgeColor(r.source_tab)}`}>
                            {r.source_tab || "UNIFIED"}
                          </span>
                        </TableCell>
                        <TableCell className="font-mono text-xs font-bold text-white/80">
                          {r.employee_no || r.pension_no || "---"}
                        </TableCell>
                        <TableCell className="font-semibold text-xs text-white max-w-[150px] truncate" title={r.full_name}>
                          {r.full_name}
                        </TableCell>
                        <TableCell className="text-xs">
                          {getSubCatLabel(r.sub_category_regular || r.sub_category_retired)}
                        </TableCell>
                        <TableCell className="text-xs max-w-[180px] truncate" title={r.nature_of_bill || r.bank_details || "N/A"}>
                          {r.nature_of_bill || r.bank_details || "---"}
                        </TableCell>
                        <TableCell className="font-mono text-xs font-bold text-emerald-400">
                          Rs. {amountToShow?.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-center font-mono text-xs">
                          {formatDateDisplay(dateToShow)}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {r.cheque_no || "---"}
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Quick Preview" onClick={() => { setPreviewRecord(r); setPreviewActiveHead(null); }}>
                              <Eye className="w-3.5 h-3.5 text-muted-foreground hover:text-primary transition-colors" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Open Full Detail" onClick={() => navigate(`/book-section/all-employees/${r.id}`)}>
                              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground hover:text-indigo-400 transition-colors" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-20 text-muted-foreground italic text-sm">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Info className="w-8 h-8 text-muted-foreground/30" />
                        <span>No records match your filters or database is currently empty</span>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 border-t border-white/5 bg-muted/10">
              <span className="text-xs text-muted-foreground">
                Showing <strong className="text-white">{(currentPage - 1) * pageSize + 1}</strong> to{" "}
                <strong className="text-white">{Math.min(currentPage * pageSize, totalCount)}</strong> of{" "}
                <strong className="text-white">{totalCount}</strong> records
              </span>

              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </Button>
                
                <span className="text-xs text-muted-foreground font-mono">
                  Page <strong className="text-white">{currentPage}</strong> of {totalPages}
                </span>

                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Preview Dialog ── */}
      <Dialog open={!!previewRecord} onOpenChange={(open) => { if (!open) { setPreviewRecord(null); setPreviewActiveHead(null); setExpandedMonth(null); } }}>
        <DialogContent className="sm:max-w-4xl bg-card border-none glass-card shadow-2xl backdrop-blur-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b border-white/5 pb-4">
            <DialogTitle className="text-lg font-bold flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <span>{previewRecord?.full_name}</span>
                <p className="text-xs font-normal text-muted-foreground">
                  {previewRecord?.employee_no ? `EMP: ${previewRecord.employee_no}` : ""}
                  {previewRecord?.pension_no ? ` • PEN: ${previewRecord.pension_no}` : ""}
                </p>
              </div>
              <Button variant="outline" size="sm" className="ml-auto gap-1.5 text-xs" onClick={() => { navigate(`/book-section/all-employees/${previewRecord?.id}`); setPreviewRecord(null); }}>
                <ExternalLink className="w-3.5 h-3.5" /> Full Profile
              </Button>
            </DialogTitle>
          </DialogHeader>

          {previewLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-4 py-2">
              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3 text-center">
                  <span className="text-[9px] uppercase font-bold text-emerald-400/70 block">Grand Total</span>
                  <p className="text-lg font-black font-mono text-emerald-400">
                    Rs. {previewAllRecs.reduce((s, r) => s + (Number(r.total_amount) || Number(r.cheque_amount) || Number(r.total_disbursement) || 0), 0).toLocaleString()}
                  </p>
                </div>
                <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/5 p-3 text-center">
                  <span className="text-[9px] uppercase font-bold text-indigo-400/70 block">Total Records</span>
                  <p className="text-lg font-black font-mono text-indigo-400">{previewAllRecs.length}</p>
                </div>
                <div className="rounded-xl border border-purple-500/30 bg-purple-500/5 p-3 text-center">
                  <span className="text-[9px] uppercase font-bold text-purple-400/70 block">Active Months</span>
                  <p className="text-lg font-black font-mono text-purple-400">
                    {previewAllRecs.filter(r => r.source_tab?.startsWith("DISB-")).map(r => r.source_tab).filter((v,i,a) => a.indexOf(v)===i).length}
                  </p>
                </div>
              </div>

              {/* Head Filter Pills */}
              <div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground mb-2 flex items-center gap-1.5">
                  <Filter className="w-3 h-3" /> Filter by Head (click to filter):
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {HEAD_DEFS.map(h => {
                    const amt = getPreviewHeadTotal(h.id);
                    if (amt === 0) return null;
                    return (
                      <button
                        key={h.id}
                        onClick={() => setPreviewActiveHead(previewActiveHead === h.id ? null : h.id)}
                        className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold transition-all ${
                          previewActiveHead === h.id
                            ? "bg-indigo-500/30 border-indigo-500/50 text-white ring-1 ring-indigo-500"
                            : "bg-white/5 border-white/10 text-muted-foreground hover:border-white/30 hover:text-white"
                        }`}
                      >
                        {h.label} · <span className={h.color}>Rs. {amt.toLocaleString()}</span>
                      </button>
                    );
                  })}
                  {previewActiveHead && (
                    <button onClick={() => setPreviewActiveHead(null)} className="px-2 py-1.5 rounded-lg border border-white/10 text-[10px] font-bold text-rose-400 hover:border-rose-500/30 flex items-center gap-1">
                      <X className="w-3 h-3" /> Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Month-wise Timeline */}
              <div className="space-y-2 max-h-[45vh] overflow-y-auto pr-1">
                {Object.entries(previewGrouped).map(([monthKey, monthRecs]) => {
                  const monthTotal = monthRecs.reduce((s, r) => s + (Number(r.total_amount) || Number(r.cheque_amount) || Number(r.total_disbursement) || 0), 0);
                  const isExp = expandedMonth === monthKey;
                  const isMulti = monthRecs.length > 1;
                  return (
                    <div key={monthKey} className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
                      <button className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors" onClick={() => setExpandedMonth(isExp ? null : monthKey)}>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-purple-400" />
                          <span className="text-sm font-bold text-white">{monthKey}</span>
                          {isMulti && <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded text-[9px] font-bold">{monthRecs.length} installments</span>}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold font-mono text-emerald-400">Rs. {monthTotal.toLocaleString()}</span>
                          {isExp ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                        </div>
                      </button>

                      {isExp && (
                        <div className="border-t border-white/5 bg-black/20 overflow-x-auto">
                          <table className="w-full text-[11px]">
                            <thead className="bg-muted/20">
                              <tr>
                                <th className="text-left text-[9px] uppercase font-bold py-2 px-3">Tab</th>
                                <th className="text-left text-[9px] uppercase font-bold py-2 px-3">Cheque</th>
                                <th className="text-left text-[9px] uppercase font-bold py-2 px-3">Date</th>
                                <th className="text-right text-[9px] uppercase font-bold py-2 px-3 text-blue-400">Fund</th>
                                <th className="text-right text-[9px] uppercase font-bold py-2 px-3 text-pink-400">Sal</th>
                                <th className="text-right text-[9px] uppercase font-bold py-2 px-3 text-purple-400">Pen</th>
                                <th className="text-right text-[9px] uppercase font-bold py-2 px-3 text-amber-400">LPR</th>
                                <th className="text-right text-[9px] uppercase font-bold py-2 px-3 text-rose-400">Med</th>
                                <th className="text-right text-[9px] uppercase font-bold py-2 px-3 text-sky-400">G.Ins</th>
                                <th className="text-right text-[9px] uppercase font-bold py-2 px-3 text-emerald-400">Total</th>
                                <th className="text-center text-[9px] uppercase font-bold py-2 px-3">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {monthRecs.map((r, i) => {
                                const total = Number(r.total_amount) || Number(r.cheque_amount) || Number(r.total_disbursement) || 0;
                                const date = r.passing_date || r.payment_date || r.disbursed_date;
                                const status = r.bank_status || r.status || "";
                                const statusColor = ["PAID","CLOSE","DEPOSITED"].includes(status.toUpperCase()) ? "text-emerald-400" : status.toUpperCase() === "RETURNED" ? "text-red-400" : "text-amber-400";
                                return (
                                  <tr key={r.id || i} className="border-t border-white/5 hover:bg-white/5">
                                    <td className="py-2 px-3"><span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${getTabBadgeColor(r.source_tab)}`}>{r.source_tab || "N/A"}</span></td>
                                    <td className="py-2 px-3 font-mono text-sky-400">{r.cheque_no || "---"}</td>
                                    <td className="py-2 px-3 font-mono text-muted-foreground">{formatDateDisplay(date)}</td>
                                    <td className="py-2 px-3 font-mono text-right text-blue-400">{r.fund_amount > 0 ? r.fund_amount.toLocaleString() : "-"}</td>
                                    <td className="py-2 px-3 font-mono text-right text-pink-400">{r.sal_amount > 0 ? r.sal_amount.toLocaleString() : "-"}</td>
                                    <td className="py-2 px-3 font-mono text-right text-purple-400">{r.pen_amount > 0 ? r.pen_amount.toLocaleString() : "-"}</td>
                                    <td className="py-2 px-3 font-mono text-right text-amber-400">{r.lpr_amount > 0 ? r.lpr_amount.toLocaleString() : "-"}</td>
                                    <td className="py-2 px-3 font-mono text-right text-rose-400">{r.med_amount > 0 ? r.med_amount.toLocaleString() : "-"}</td>
                                    <td className="py-2 px-3 font-mono text-right text-sky-400">{r.gins_amount > 0 ? r.gins_amount.toLocaleString() : "-"}</td>
                                    <td className="py-2 px-3 font-mono font-bold text-emerald-400 text-right">Rs. {total.toLocaleString()}</td>
                                    <td className="py-2 px-3 text-center font-bold uppercase text-[9px]"><span className={statusColor}>{status || "---"}</span></td>
                                  </tr>
                                );
                              })}
                            </tbody>
                            <tfoot className="bg-muted/20 border-t border-white/10">
                              <tr>
                                <td colSpan={9} className="py-1.5 px-3 text-[9px] uppercase font-bold text-muted-foreground">Subtotal</td>
                                <td className="py-1.5 px-3 font-mono font-black text-emerald-400 text-right">Rs. {monthTotal.toLocaleString()}</td>
                                <td />
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}
