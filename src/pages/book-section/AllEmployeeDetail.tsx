import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  ArrowLeft, Users, Wallet, Calendar, CreditCard,
  TrendingUp, Filter, X, ChevronDown, ChevronUp,
  Hash, Building2, Banknote, CheckCircle2, Clock, AlertCircle,
  Eye, User, ImageIcon
} from "lucide-react";
import { toast } from "sonner";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatDateDisplay = (dateStr: string | null) => {
  if (!dateStr) return "---";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
  } catch { return dateStr; }
};

const getSubCatLabel = (val: string | null) => {
  if (!val) return "---";
  const mapping: Record<string, string> = {
    "cp-fund": "CP Fund", funds: "Funds", "supp-salary": "Supp Salary",
    "house-building": "House Building", tada: "TADA", overtime: "Overtime",
    fund: "Fund", lpr: "LPR", "pension-gratuity": "Pension Gratuity",
    "pension-arrear": "Pension Arrear", "financial-assistance": "Financial Assistance",
  };
  return mapping[val] || val;
};

const getTabBadgeColor = (tabName: string) => {
  if (!tabName) return "bg-gray-500/20 text-gray-400";
  const t = tabName.toUpperCase();
  if (t.includes("CP.FUND") || t.includes("F.C")) return "bg-blue-500/20 text-blue-400";
  if (t.includes("L.P.R") || t.includes("H.B.L") || t.includes("M.M.L")) return "bg-amber-500/20 text-amber-400";
  if (t.includes("PEN")) return "bg-purple-500/20 text-purple-400";
  if (t.includes("DISB")) return "bg-emerald-500/20 text-emerald-400";
  if (t.includes("SALARY")) return "bg-pink-500/20 text-pink-400";
  if (t.includes("T.A.D.A") || t.includes("O.T")) return "bg-sky-500/20 text-sky-400";
  if (t.includes("F.A") || t.includes("G.I") || t.includes("MED") || t.includes("HINDO")) return "bg-rose-500/20 text-rose-400";
  return "bg-indigo-500/20 text-indigo-400";
};

// Parse source_tab into a readable Month/Year label
const parseTabToDate = (tab: string) => {
  if (!tab) return null;
  // e.g. "DISB-JAN24", "DISB-JAN 24", "DISB-JANUARY 2024"
  const cleaned = tab.replace(/^DISB-/i, "").trim();
  // Try common month abbreviations
  const monthMap: Record<string, string> = {
    JAN:"Jan", FEB:"Feb", MAR:"Mar", APR:"Apr", MAY:"May", JUNE:"Jun", JUN:"Jun",
    JULY:"Jul", JUL:"Jul", AUG:"Aug", SEP:"Sep", OCT:"Oct", NOV:"Nov", DEC:"Dec",
  };
  const match = cleaned.match(/^([A-Z]+)\s*(\d{2,4})$/i);
  if (match) {
    const mon = monthMap[match[1].toUpperCase()] || match[1];
    const yr = match[2].length === 2 ? "20" + match[2] : match[2];
    return `${mon} ${yr}`;
  }
  return cleaned;
};

const getBankStatusColor = (status: string | null) => {
  if (!status) return "bg-gray-500/20 text-gray-400";
  const s = status.toUpperCase();
  if (s === "PAID" || s === "CLOSE" || s === "DEPOSITED") return "bg-emerald-500/20 text-emerald-400";
  if (s === "RETURNED") return "bg-red-500/20 text-red-400";
  return "bg-amber-500/20 text-amber-400";
};

const getRecordMonthYear = (r: any) => {
  const tab = r.source_tab || "";
  if (tab.toUpperCase().startsWith("DISB-")) {
    const dateLabel = parseTabToDate(tab);
    if (dateLabel) return dateLabel;
  }
  
  const dateStr = r.passing_date || r.payment_date || r.disbursed_date || r.cheque_date;
  if (dateStr) {
    try {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
      }
    } catch {}
  }
  
  return tab || "Other / Non-Monthly";
};

const getMonthYearSortValue = (key: string) => {
  const parts = key.split(" ");
  if (parts.length === 2) {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthIndex = monthNames.indexOf(parts[0]);
    const year = parseInt(parts[1]);
    if (monthIndex !== -1 && !isNaN(year)) {
      return year * 100 + (monthIndex + 1);
    }
  }
  const match = key.match(/^(\d{4})-(\d{2})$/);
  if (match) {
    return parseInt(match[1]) * 100 + parseInt(match[2]);
  }
  return 0;
};

// ─── Head definitions ─────────────────────────────────────────────────────────
const HEAD_DEFS = [
  { id: "CP.FUND",         label: "CP.FUND",       displayName: "CP Fund",        color: "blue" },
  { id: "L.P.R",           label: "L.P.R",         displayName: "LPR",            color: "amber" },
  { id: "PEN",             label: "PEN",           displayName: "Pension/Grat",   color: "purple" },
  { id: "F.A",             label: "F.A",           displayName: "Fin. Assist.",   color: "rose" },
  { id: "G.I",             label: "G.I",           displayName: "Group Ins.",     color: "rose" },
  { id: "F.C",             label: "F.C",           displayName: "Funds (FC)",     color: "blue" },
  { id: "S.SALARY",        label: "S.SALARY",      displayName: "Supp. Salary",   color: "pink" },
  { id: "C.SALARY",        label: "C.SALARY",      displayName: "Cont. Salary",   color: "pink" },
  { id: "T.A.D.A",         label: "T.A.D.A",       displayName: "TADA",           color: "sky" },
  { id: "O.T",             label: "O.T",           displayName: "Overtime",       color: "sky" },
  { id: "H.B.L",           label: "H.B.L",         displayName: "House Building", color: "amber" },
  { id: "M.M.L",           label: "M.M.L",         displayName: "Motorcycle Loan",color: "amber" },
  { id: "MED",             label: "MED",           displayName: "Medical Claim",  color: "rose" },
  { id: "HINDO FESTIVAL",  label: "HINDO FEST.",   displayName: "Hindu Festival", color: "rose" },
  { id: "DISB",            label: "DISB",          displayName: "Disbursements",  color: "emerald" },
];

const HEAD_COLOR_MAP: Record<string, string> = {
  blue:    "bg-blue-500/10 border-blue-500/30 text-blue-400",
  amber:   "bg-amber-500/10 border-amber-500/30 text-amber-400",
  purple:  "bg-purple-500/10 border-purple-500/30 text-purple-400",
  rose:    "bg-rose-500/10 border-rose-500/30 text-rose-400",
  pink:    "bg-pink-500/10 border-pink-500/30 text-pink-400",
  sky:     "bg-sky-500/10 border-sky-500/30 text-sky-400",
  emerald: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
};

const MONTHS = [
  { value: "ALL", label: "All Months" },
  { value: "JAN", label: "January" },
  { value: "FEB", label: "February" },
  { value: "MAR", label: "March" },
  { value: "APR", label: "April" },
  { value: "MAY", label: "May" },
  { value: "JUN", label: "June" },
  { value: "JUL", label: "July" },
  { value: "AUG", label: "August" },
  { value: "SEP", label: "September" },
  { value: "OCT", label: "October" },
  { value: "NOV", label: "November" },
  { value: "DEC", label: "December" },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function AllEmployeeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [record, setRecord] = useState<any>(null);
  const [allRecords, setAllRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRelated, setLoadingRelated] = useState(false);
  const [activeHead, setActiveHead] = useState<string | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [expandedYear, setExpandedYear] = useState<string | null>(null);
  const [selectedViewRecord, setSelectedViewRecord] = useState<any>(null);
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({});
  const [selectedYear, setSelectedYear] = useState<string>("ALL");
  const [selectedMonth, setSelectedMonth] = useState<string>("ALL");
  const [selectedEmployee, setSelectedEmployee] = useState<string>("ALL");

  const toggleMonth = (monthKey: string) => {
    setExpandedMonths(prev => ({
      ...prev,
      [monthKey]: prev[monthKey] === false ? true : false
    }));
  };

  const isMonthExpanded = (monthKey: string) => {
    return expandedMonths[monthKey] !== false; // Default to true (expanded)
  };
  
  // Fetch main record
  useEffect(() => {
    const fetchRecord = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("book_section_employees").select("*").eq("id", id).single();
        if (error) throw error;
        setRecord(data);
        // Automatically filter to this employee's data
        if (data.employee_no) setSelectedEmployee(String(data.employee_no));
      } catch (err: any) {
        toast.error("Failed to load record: " + err.message);
      } finally { setLoading(false); }
    };
    if (id) fetchRecord();
  }, [id]);

  // Fetch all related records (same employee)
  useEffect(() => {
    if (!record) return;
    const fetchRelated = async () => {
      setLoadingRelated(true);
      try {
        const conditions: string[] = [];
        if (record.employee_no?.trim()) conditions.push(`employee_no.eq.${record.employee_no}`);
        if (record.pension_no?.trim()) conditions.push(`pension_no.eq.${record.pension_no}`);
        if (record.full_name?.trim()) conditions.push(`full_name.eq.${record.full_name}`);
        const query = supabase.from("book_section_employees").select("*");
        const { data, error } = conditions.length > 0
          ? await query.or(conditions.join(",")).order("passing_date", { ascending: false }).limit(10000)
          : await query.eq("id", record.id).limit(10000);
        if (error) {
          console.error("Error fetching related records:", error);
          setAllRecords([]);
        } else if (data) {
          setAllRecords(data);
        }
      } catch (err) {
        console.error(err);
        setAllRecords([]);
      } finally {
        setLoadingRelated(false);
      }
    };
    fetchRelated();
  }, [record]);

  // ── Filter records by active head, year and month ──
  const filteredRecords = useMemo(() => {
    let recs = allRecords;

    // 1. Filter by selected employee first (if any)
    if (selectedEmployee !== "ALL") {
      const empSearch = String(selectedEmployee).toLowerCase();
      recs = recs.filter((r) => {
        const emp = (r.employee_no ?? "").toString().toLowerCase();
        const pen = (r.pension_no ?? "").toString().toLowerCase();
        return emp.includes(empSearch) || pen.includes(empSearch);
      });
    }

    // 2. Filter by Active Head
    if (activeHead) {
      const headToSubcat: Record<string, string[]> = {
        "CP.FUND": ["cp-fund"],
        "L.P.R": ["lpr"],
        "PEN": ["pension-gratuity"],
        "F.A": ["financial-assistance"],
        "G.I": ["g-ins"],
        "F.C": ["funds"],
        "S.SALARY": ["supp-salary"],
        "C.SALARY": ["cont-salary"],
        "T.A.D.A": ["tada"],
        "O.T": ["overtime"],
        "H.B.L": ["house-building"],
        "M.M.L": ["motorcycle-loan"],
        "MED": ["med"],
        "HINDO FESTIVAL": ["hindu-festival"],
        "DISB": ["disbursement"],
      };

      recs = recs.filter((r) => {
        const subcat = (r.sub_category_regular || r.sub_category_retired || "").toLowerCase();
        const allowedSubcats = headToSubcat[activeHead] || [];
        if (allowedSubcats.includes(subcat)) return true;

        const tab = r.source_tab?.toUpperCase() || "";
        if (activeHead === "DISB" && (subcat === "" || subcat === "disbursement") && tab.startsWith("DISB-")) return true;
        return tab === activeHead;
      });
    }

    // 3. Filter by Year (only if a specific year is chosen)
    if (selectedYear !== "ALL") {
      recs = recs.filter((r) => {
        const tab = r.source_tab || "";
        if (tab.toUpperCase().startsWith("DISB-")) {
          const matched = tab.match(/\d{2,4}$/);
          if (matched) {
            const yr = matched[0].length === 2 ? "20" + matched[0] : matched[0];
            if (yr === selectedYear) return true;
          }
        }
        const dateStr = r.passing_date || r.payment_date || r.disbursed_date || r.cheque_date;
        if (dateStr) {
          const parsed = new Date(dateStr);
          if (!isNaN(parsed.getTime())) {
            if (parsed.getFullYear().toString() === selectedYear) return true;
          } else {
            const match = dateStr.match(/\b(\d{4})\b/);
            if (match && match[1] === selectedYear) return true;
          }
        }
        return false;
      });
    }

    // 4. Filter by Month (only if a specific month is chosen)
    if (selectedMonth !== "ALL") {
      recs = recs.filter((r) => {
        const tab = r.source_tab || "";
        if (tab.toUpperCase().startsWith("DISB-")) {
          const cleaned = tab.replace(/^DISB-/i, "").trim();
          const match = cleaned.match(/^([A-Z]+)/i);
          if (match) {
            const monAbbr = match[1].substring(0, 3).toUpperCase();
            if (monAbbr === selectedMonth.toUpperCase()) return true;
          }
        }
        const dateStr = r.passing_date || r.payment_date || r.disbursed_date || r.cheque_date;
        if (dateStr) {
          const m = dateStr.slice(5, 7); // "01" for Jan
          const monthIndex = parseInt(m) - 1;
          const monthAbbrs = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
          if (monthIndex >= 0 && monthIndex < 12 && monthAbbrs[monthIndex] === selectedMonth.toUpperCase()) {
            return true;
          }
        }
        return false;
      });
    }

    return recs;
  }, [allRecords, activeHead, selectedYear, selectedMonth, selectedEmployee]);

  // ── Unique Years list from allRecords ──
  const uniqueYears = useMemo(() => {
    const years = new Set<string>();
    for (const r of allRecords) {
      const tab = r.source_tab || "";
      if (tab.toUpperCase().startsWith("DISB-")) {
        const matched = tab.match(/\d{2,4}$/);
        if (matched) {
          const yr = matched[0].length === 2 ? "20" + matched[0] : matched[0];
          if (/^\d{4}$/.test(yr)) years.add(yr);
        }
      }
      const dateStr = r.passing_date || r.payment_date || r.disbursed_date || r.cheque_date;
      if (dateStr) {
        // Try to parse with Date constructor
        const parsed = new Date(dateStr);
        if (!isNaN(parsed.getTime())) {
          years.add(parsed.getFullYear().toString());
        } else {
          // Fallback: extract any 4‑digit year via regex
          const match = dateStr.match(/\b(\d{4})\b/);
          if (match) years.add(match[1]);
        }
      }
    }
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [allRecords]);

  // ── Unique Employees list from allRecords ──
  const uniqueEmployees = useMemo(() => {
    const empMap = new Map<string, string>();
    for (const r of allRecords) {
      if (r.employee_no) {
        empMap.set(r.employee_no, r.full_name || "");
      }
    }
    return Array.from(empMap.entries()).map(([empNo, name]) => ({
      value: empNo,
      label: `${name} (${empNo})`,
    }));
  }, [allRecords]);


  // ── Head-wise totals ──
  const headTotals = useMemo(() => {
    const totals: Record<string, { total: number; count: number }> = {};
    const headToSubcat: Record<string, string[]> = {
      "CP.FUND": ["cp-fund"],
      "L.P.R": ["lpr"],
      "PEN": ["pension-gratuity"],
      "F.A": ["financial-assistance"],
      "G.I": ["g-ins"],
      "F.C": ["funds"],
      "S.SALARY": ["supp-salary"],
      "C.SALARY": ["cont-salary"],
      "T.A.D.A": ["tada"],
      "O.T": ["overtime"],
      "H.B.L": ["house-building"],
      "M.M.L": ["motorcycle-loan"],
      "MED": ["med"],
      "HINDO FESTIVAL": ["hindu-festival"],
      "DISB": ["disbursement"],
    };

    for (const h of HEAD_DEFS) {
      const allowedSubcats = headToSubcat[h.id] || [];
      const recs = allRecords.filter((r) => {
        const subcat = (r.sub_category_regular || r.sub_category_retired || "").toLowerCase();
        if (allowedSubcats.includes(subcat)) return true;

        const tab = r.source_tab?.toUpperCase() || "";
        if (h.id === "DISB" && (subcat === "" || subcat === "disbursement") && tab.startsWith("DISB-")) return true;
        return tab === h.id;
      });
      const total = recs.reduce((s, r) =>
        s + (Number(r.total_amount) || Number(r.cheque_amount) || Number(r.total_disbursement) || 0), 0);
      totals[h.id] = { total, count: recs.length };
    }
    return totals;
  }, [allRecords]);

  // ── Grand totals ──
  const grandTotal = useMemo(() =>
    allRecords.reduce((s, r) =>
      s + (Number(r.total_amount) || Number(r.cheque_amount) || Number(r.total_disbursement) || 0), 0)
  , [allRecords]);

  // ── Group filtered records by month/year ──
  const groupedByMonth = useMemo(() => {
    const groups: Record<string, any[]> = {};
    for (const r of filteredRecords) {
      const key = getRecordMonthYear(r);
      if (!groups[key]) groups[key] = [];
      groups[key].push(r);
    }
    
    // Sort keys chronologically (descending)
    return Object.keys(groups)
      .sort((a, b) => getMonthYearSortValue(b) - getMonthYearSortValue(a))
      .reduce((acc, key) => {
        acc[key] = groups[key];
        return acc;
      }, {} as Record<string, any[]>);
  }, [filteredRecords]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
      <span className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Loading Record...</span>
    </div>
  );

  if (!record) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Users className="w-16 h-16 text-muted-foreground/20" />
      <p className="text-muted-foreground">Record not found.</p>
      <Button variant="outline" onClick={() => navigate(-1)}><ArrowLeft className="w-4 h-4 mr-2" /> Go Back</Button>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in pb-10 font-sans">
      {/* Back + Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-white" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-heading tracking-tight">{record.full_name}</h1>
            <p className="text-xs text-muted-foreground">
              {record.employee_no ? `EMP: ${record.employee_no}` : ""}{record.pension_no ? ` • PEN: ${record.pension_no}` : ""} • Unified Employee Profile
            </p>
          </div>
        </div>
      </div>

      {/* ── Profile + Stats ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Profile Card */}
        <div className="lg:col-span-1 rounded-2xl border border-white/10 bg-card/60 backdrop-blur-xl shadow-xl overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500" />
          <div className="p-5 space-y-4">
            {/* Photo */}
            <div className="w-full aspect-square rounded-xl border border-white/10 overflow-hidden bg-white/5 max-h-48">
              {record.photo_url
                ? <img src={record.photo_url} alt="Staff" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-muted-foreground/30">
                    <Users className="w-12 h-12" />
                    <span className="text-[9px] font-bold uppercase tracking-widest">No Photo</span>
                  </div>}
            </div>
            {/* Identity */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                <span className="text-muted-foreground uppercase font-bold tracking-tighter">Full Name</span>
                <span className="font-bold text-white text-right max-w-[150px] truncate">{record.full_name}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                <span className="text-muted-foreground uppercase font-bold tracking-tighter">Employee No</span>
                <span className="font-mono font-bold text-blue-400">{record.employee_no || "---"}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                <span className="text-muted-foreground uppercase font-bold tracking-tighter">Pension No</span>
                <span className="font-mono font-bold text-rose-400">{record.pension_no || "---"}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                <span className="text-muted-foreground uppercase font-bold tracking-tighter">CNIC</span>
                <span className="font-mono text-white">{record.cnic_no || "---"}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                <span className="text-muted-foreground uppercase font-bold tracking-tighter">Category</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${record.category === "Employed" ? "bg-blue-500/20 text-blue-400" : "bg-rose-500/20 text-rose-400"}`}>
                  {record.category}
                </span>
              </div>
              {record.bank_details && (
                <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                  <span className="text-muted-foreground uppercase font-bold tracking-tighter">Bank</span>
                  <span className="font-mono text-sky-400 text-right max-w-[150px] truncate">{record.bank_details}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-3 content-start">
          {/* Grand Total */}
          <div className="col-span-2 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-400/70 tracking-widest block">Grand Total (All Claims)</span>
              <p className="text-3xl font-black font-mono text-emerald-400 mt-1">Rs. {grandTotal.toLocaleString()}</p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <TrendingUp className="w-7 h-7 text-emerald-400" />
            </div>
          </div>
          {/* Count */}
          <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/5 p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-indigo-400/70 tracking-widest block">Total Records</span>
              <p className="text-2xl font-black font-mono text-indigo-400 mt-1">{allRecords.length}</p>
            </div>
            <Hash className="w-6 h-6 text-indigo-400/40" />
          </div>
          {/* Months */}
          <div className="rounded-xl border border-purple-500/30 bg-purple-500/5 p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-purple-400/70 tracking-widest block">Months with Activity</span>
              <p className="text-2xl font-black font-mono text-purple-400 mt-1">
                {allRecords.filter(r => r.source_tab?.startsWith("DISB-")).map(r => r.source_tab).filter((v,i,a) => a.indexOf(v) === i).length}
              </p>
            </div>
            <Calendar className="w-6 h-6 text-purple-400/40" />
          </div>
          {/* Passing Date */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-muted-foreground/70 tracking-widest block">Last Passing Date</span>
              <p className="text-sm font-bold font-mono text-white mt-1">{formatDateDisplay(record.passing_date || record.payment_date)}</p>
            </div>
            <CreditCard className="w-6 h-6 text-muted-foreground/30" />
          </div>
          {/* Cheque No */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-muted-foreground/70 tracking-widest block">Latest Cheque No</span>
              <p className="text-sm font-bold font-mono text-sky-400 mt-1">{record.cheque_no || "---"}</p>
            </div>
            <Banknote className="w-6 h-6 text-muted-foreground/30" />
          </div>
        </div>
      </div>

      {/* ── Head-Wise Clickable Summary ── */}
      <div className="rounded-2xl border border-white/10 bg-card/60 backdrop-blur-xl shadow-xl overflow-hidden">
        <div className="h-1 bg-indigo-500/50" />
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
              <Wallet className="w-4 h-4" /> Head-Wise Claims Summary
            </h4>
            {activeHead && (
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground hover:text-white h-7" onClick={() => setActiveHead(null)}>
                <X className="w-3.5 h-3.5" /> Clear Filter
              </Button>
            )}
          </div>

          {/* Head Cards — clickable */}
          <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-8 gap-2">
            {HEAD_DEFS.map((head) => {
              const { total, count } = headTotals[head.id] || { total: 0, count: 0 };
              const isActive = total > 0;
              const isSelected = activeHead === head.id;
              const colorClass = isActive ? HEAD_COLOR_MAP[head.color] : "bg-white/5 border-white/5 text-muted-foreground/30";
              return (
                <button
                  key={head.id}
                  onClick={() => isActive ? setActiveHead(isSelected ? null : head.id) : null}
                  disabled={!isActive}
                  className={`relative p-3 rounded-xl border text-center transition-all duration-200 text-left ${colorClass} ${
                    isSelected ? "ring-2 ring-white/30 scale-[1.04] shadow-lg" : isActive ? "hover:scale-[1.02] hover:shadow-md cursor-pointer" : "cursor-not-allowed"
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-1 right-1">
                      <Filter className="w-2.5 h-2.5" />
                    </div>
                  )}
                  <span className="text-[9px] font-black block uppercase tracking-tighter">{head.label}</span>
                  <span className="text-[8px] opacity-60 block mt-0.5">{head.displayName}</span>
                  {isActive ? (
                    <>
                      <span className="text-[10px] font-mono font-black block mt-1.5">Rs. {total.toLocaleString()}</span>
                      <span className="text-[8px] opacity-60 block">{count} record{count !== 1 ? "s" : ""}</span>
                    </>
                  ) : (
                    <span className="text-[10px] font-mono font-black block mt-1.5 opacity-30">---</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Active Filter Label */}
          {activeHead && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
              <Filter className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-xs text-indigo-400 font-bold">
                Showing: <span className="text-white">{HEAD_DEFS.find(h => h.id === activeHead)?.displayName}</span> — {filteredRecords.length} records — Rs. {(headTotals[activeHead]?.total || 0).toLocaleString()}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Year‑Wise & Month‑Wise Payment Timeline ── */}
      <div className="rounded-2xl border border-white/10 bg-card/60 backdrop-blur-xl shadow-xl overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-purple-500 to-emerald-500" />
        <div className="p-5 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/5 pb-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-purple-400 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {activeHead ? `${HEAD_DEFS.find(h => h.id === activeHead)?.displayName} — Payment Timeline` : "Complete Payment Timeline (All Heads)"}
            </h4>
            
            {/* Year & Month Filters */}
            <div className="flex flex-wrap items-center gap-3">
              {loadingRelated && (
                <div className="w-4 h-4 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mr-1" />
              )}
              {/* Year Selector */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Year:</span>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="bg-black/40 border border-white/10 rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-purple-500/50"
                >
                  <option value="ALL">All Years</option>
                  {uniqueYears.map((yr) => (
                    <option key={yr} value={yr}>{yr}</option>
                  ))}
                </select>
              </div>

              {/* Month Selector */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Month:</span>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-black/40 border border-white/10 rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-purple-500/50"
                >
                  {MONTHS.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>

              {/* Employee Selector */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase font-bold text-muted-foreground">Employee:</span>
                <select
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  className="bg-black/40 border border-white/10 rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-purple-500/50"
                >
                  <option value="ALL">All Employees</option>
                  {uniqueEmployees.map((emp) => (
                    <option key={emp.value} value={emp.value}>{emp.label}</option>
                  ))}
                </select>
              </div>

              {/* Clear Filters button */}
              {(selectedYear !== "ALL" || selectedMonth !== "ALL" || selectedEmployee !== "ALL") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setSelectedYear("ALL"); setSelectedMonth("ALL"); setSelectedEmployee("ALL"); }}
                  className="h-7 px-2 text-[10px] font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 gap-1 border border-rose-500/20"
                >
                  <X className="w-3 h-3" /> Reset
                </Button>
              )}
            </div>
          </div>

          {/* Detailed Records Table Grouped by Month/Year */}
          {filteredRecords.length === 0 ? (
            <p className="text-muted-foreground text-center">No records to display.</p>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedByMonth).map(([monthKey, monthRecs]) => {
                const monthTotal = monthRecs.reduce((s, r) => s + (Number(r.total_amount) || Number(r.cheque_amount) || Number(r.total_disbursement) || 0), 0);
                const isExpanded = isMonthExpanded(monthKey);
                
                return (
                  <div key={monthKey} className="rounded-xl border border-white/10 bg-white/5 overflow-hidden transition-all duration-200">
                    {/* Collapsible Month Header */}
                    <button
                      onClick={() => toggleMonth(monthKey)}
                      className="w-full flex items-center justify-between p-3.5 hover:bg-white/10 bg-white/5 transition-colors border-b border-white/5 text-left"
                    >
                      <div className="flex items-center gap-2.5">
                        <Calendar className="w-4 h-4 text-purple-400" />
                        <span className="text-sm font-bold text-white tracking-tight">{monthKey}</span>
                        <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded-md text-[9px] font-bold">
                          {monthRecs.length} record{monthRecs.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-muted-foreground">Month Total:</span>
                        <span className="text-sm font-black font-mono text-emerald-400">Rs. {monthTotal.toLocaleString()}</span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                    </button>

                    {/* Table of records for this month */}
                    {isExpanded && (
                      <div className="overflow-x-auto bg-black/20">
                        <table className="w-full text-xs text-left border-collapse whitespace-nowrap">
                          <thead>
                            <tr className="bg-white/5 border-b border-white/10 uppercase text-[9px] font-bold text-muted-foreground">
                              <th className="py-2.5 px-3">Tab / Month</th>
                              <th className="py-2.5 px-3">Sub-Category</th>
                              <th className="py-2.5 px-3">Nature of Bill</th>
                              <th className="py-2.5 px-3 text-blue-400 text-right">Fund</th>
                              <th className="py-2.5 px-3 text-pink-400 text-right">Sal</th>
                              <th className="py-2.5 px-3 text-purple-400 text-right">Pen/Grat</th>
                              <th className="py-2.5 px-3 text-amber-400 text-right">LPR</th>
                              <th className="py-2.5 px-3 text-emerald-400 text-right">Disb</th>
                              <th className="py-2.5 px-3 text-rose-400 text-right">Med</th>
                              <th className="py-2.5 px-3 text-sky-400 text-right">G.Ins</th>
                              <th className="py-2.5 px-3 text-emerald-400 text-right">Total (Rs.)</th>
                              <th className="py-2.5 px-3">Cheque No</th>
                              <th className="py-2.5 px-3">Date</th>
                              <th className="py-2.5 px-3">Status</th>
                              <th className="py-2.5 px-3 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {monthRecs.map((r, i) => {
                              const total = Number(r.total_amount) || Number(r.cheque_amount) || Number(r.total_disbursement) || 0;
                              const date = r.passing_date || r.payment_date || r.disbursed_date;
                              const status = r.bank_status || r.status || "";
                              const statusColor = getBankStatusColor(status);
                              return (
                                <tr key={r.id || i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                  <td className="py-2.5 px-3">
                                    <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${getTabBadgeColor(r.source_tab)}`}>
                                      {r.source_tab || "UNIFIED"}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3 font-semibold text-white/80">
                                    {getSubCatLabel(r.sub_category_regular || r.sub_category_retired)}
                                  </td>
                                  <td className="py-2.5 px-3 max-w-[150px] truncate text-muted-foreground" title={r.nature_of_bill || r.bank_details || "N/A"}>
                                    {r.nature_of_bill || r.bank_details || "---"}
                                  </td>
                                  <td className="py-2.5 px-3 font-mono text-blue-400 text-right">{r.fund_amount > 0 ? r.fund_amount.toLocaleString() : "-"}</td>
                                  <td className="py-2.5 px-3 font-mono text-pink-400 text-right">{r.sal_amount > 0 ? r.sal_amount.toLocaleString() : "-"}</td>
                                  <td className="py-2.5 px-3 font-mono text-purple-400 text-right">{r.pen_amount > 0 ? r.pen_amount.toLocaleString() : "-"}</td>
                                  <td className="py-2.5 px-3 font-mono text-amber-400 text-right">{r.lpr_amount > 0 ? r.lpr_amount.toLocaleString() : "-"}</td>
                                  <td className="py-2.5 px-3 font-mono text-emerald-400 text-right">{r.disb_amount > 0 || r.disbursed_date ? (r.disb_amount || total).toLocaleString() : "-"}</td>
                                  <td className="py-2.5 px-3 font-mono text-rose-400 text-right">{r.med_amount > 0 ? r.med_amount.toLocaleString() : "-"}</td>
                                  <td className="py-2.5 px-3 font-mono text-sky-400 text-right">{r.gins_amount > 0 ? r.gins_amount.toLocaleString() : "-"}</td>
                                  <td className="py-2.5 px-3 font-mono font-bold text-emerald-400 text-right">
                                    Rs. {total.toLocaleString()}
                                  </td>
                                  <td className="py-2.5 px-3 font-mono text-sky-400">{r.cheque_no || "---"}</td>
                                  <td className="py-2.5 px-3 font-mono text-muted-foreground">{formatDateDisplay(date)}</td>
                                  <td className="py-2.5 px-3">
                                    <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${statusColor}`}>
                                      {status || "---"}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3 text-right">
                                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setSelectedViewRecord(r)}>
                                      <Eye className="w-3.5 h-3.5 text-muted-foreground hover:text-white transition-colors" />
                                    </Button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {/* Overall Total Footer */}
          {filteredRecords.length > 0 && (
            <div className="flex justify-between items-center px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 mt-2">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                {activeHead ? HEAD_DEFS.find(h => h.id === activeHead)?.displayName : "All Heads"} — Grand Total
              </span>
              <span className="text-lg font-black font-mono text-emerald-400">
                Rs. {filteredRecords.reduce((s, r) => s + (Number(r.total_amount) || Number(r.cheque_amount) || Number(r.total_disbursement) || 0), 0).toLocaleString()}
              </span>
            </div>
          )}

        </div>
      </div>

      {/* Detailed View Dialog */}
      <Dialog open={!!selectedViewRecord} onOpenChange={(open) => !open && setSelectedViewRecord(null)}>
        <DialogContent className="sm:max-w-3xl bg-card border-none glass-card shadow-2xl backdrop-blur-xl max-h-[90vh] overflow-y-auto text-white">
          <DialogHeader className="border-b border-white/5 pb-4">
            <DialogTitle className="text-xl font-bold flex items-center gap-3 font-heading">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                 <User className="w-6 h-6 text-primary" />
              </div>
              Record # {selectedViewRecord?.serial_no || "Auto"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6 p-4">
            <div className="space-y-4">
               <div className="w-full aspect-square rounded-xl border border-white/10 overflow-hidden bg-white/5 flex items-center justify-center">
                  {selectedViewRecord?.photo_url ? (
                    <img src={selectedViewRecord.photo_url} alt="Staff" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center flex-col gap-2 text-muted-foreground/40">
                       <ImageIcon className="w-12 h-12" />
                       <span className="text-[10px] font-bold uppercase tracking-widest">No Photo Available</span>
                    </div>
                  )}
               </div>
               <div className="p-3 bg-primary/5 rounded-lg border border-primary/10 font-sans">
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

              <div className="space-y-1 pt-2 border-t border-white/5 font-sans">
                <span className="text-[10px] uppercase font-bold text-muted-foreground opacity-60">Bank Account / Payment Record</span>
                <p className="font-semibold text-blue-400 bg-blue-500/5 p-2 rounded border border-blue-500/10 text-xs italic">{selectedViewRecord?.bank_details || "No details provided"}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/5 font-sans">
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
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/5 font-sans">
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
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/5 font-sans">
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
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5 font-sans">
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

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5 font-sans">
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
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/5 font-mono text-xs">
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

              <div className="space-y-1 pt-2 border-t border-white/5 font-sans">
                 <div className="flex justify-between items-end">
                    <div>
                       <span className="text-[10px] uppercase font-bold text-emerald-500">Total Approved</span>
                       <p className="text-xl font-bold font-mono text-emerald-400">Rs.{selectedViewRecord?.total_amount?.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                       <span className="text-[10px] uppercase font-bold text-rose-500">Net Payable</span>
                       <p className="text-lg font-bold font-mono text-rose-400">Rs.{selectedViewRecord?.cheque_amount?.toLocaleString()}</p>
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
            <div className="border-t border-white/5 p-4 space-y-3 bg-emerald-500/5 rounded-b-xl font-sans">
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
                    <span className="text-[9px] uppercase font-medium text-muted-foreground block">Disbursement Amount</span>
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

              <div className="grid grid-cols-2 gap-4 pt-2 font-mono text-xs">
                {selectedViewRecord?.total_disbursement > 0 && (
                  <div>
                    <span className="text-[10px] uppercase font-bold text-emerald-500">Total Disbursement</span>
                    <p className="font-bold text-emerald-400">Rs. {selectedViewRecord.total_disbursement.toLocaleString()}</p>
                  </div>
                )}
                {selectedViewRecord?.bank_status && (
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-sky-500">Bank Status</span>
                    <p className="font-bold text-sky-400">{selectedViewRecord.bank_status}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
