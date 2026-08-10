"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Search,
  MapPin,
  Clock,
  History,
  FileText,
  Printer,
  ArrowRight,
  CheckCircle2,
  FileSearch,
  Building2,
  Shield,
  Calendar,
  User,
  MessageSquare,
  Save,
  Loader2,
  FileSignature,
  PenTool,
  RotateCcw as ResetIcon,
  Trash2,
  Check,
  Upload,
  Image as ImageIcon,
  Bell,
  ArrowDownCircle,
  ArrowUpCircle,
  ArrowLeft,
  Plus,
  ShieldCheck, Eye,
  FileEdit,
  Inbox,
  LayoutDashboard,
  Users,
  RefreshCw,
  Network,
  ScanLine
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/mock-data";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAppConfig, getSubCategoriesFor, sectionsToLegacy } from "@/hooks/useAppConfig";
import { logActivity } from "@/hooks/useActivityLog";
import { addToOfflineQueue } from "@/lib/offlineSync";
import JourneyMapModal from "@/components/JourneyMapModal";

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

const safeFormatDate = (dateStr: any) => {
  if (!dateStr) return new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  let d;
  if (dateStr instanceof Date) {
    d = dateStr;
  } else if (typeof dateStr === 'string') {
    d = new Date(dateStr.includes('T') ? dateStr : dateStr + 'T00:00:00');
  } else {
    d = new Date(dateStr);
  }
  if (isNaN(d.getTime())) return new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

// Helper to extract the local YYYY-MM-DD, avoiding UTC timezone shifts
const getLocalDateString = (dateStr?: string | Date | null): string => {
  const d = dateStr ? new Date(typeof dateStr === 'string' && !dateStr.includes('T') ? dateStr + 'T00:00:00' : dateStr) : new Date();
  if (isNaN(d.getTime())) {
    const now = new Date();
    return now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return year + '-' + month + '-' + day;
};

export default function FileTracking() {
  const location = useLocation();
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState("register");
  const [isForwardingMode, setIsForwardingMode] = useState(false);

  // Filters & Pagination
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterSubCategory, setFilterSubCategory] = useState<string>("all");
  const [filterSection, setFilterSection] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<"active" | "exited">("active");
  const [isExitingFile, setIsExitingFile] = useState(false);
  
  // Auto-Exit Scanner State
  const [scanInput, setScanInput] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [exitModalFile, setExitModalFile] = useState<any>(null);
  const [exitModalScanInput, setExitModalScanInput] = useState("");
  // Server-side pagination & filtering
  const DB_PAGE_SIZE = 50;
  const [currentPage, setCurrentPage] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBill, setSelectedBill] = useState<any>(null);
  const [coveringSlipPrintDate, setCoveringSlipPrintDate] = useState(getLocalDateString());
  const [coveringSlipCreatedDate, setCoveringSlipCreatedDate] = useState(getLocalDateString());

  // Auth-based role detection
  const { userRole, userName, signOut, isAdmin, verifyPassword } = useAuth();
  const currentRole = userRole || 'cfo';
  const isFileViewer = currentRole === 'file_viewer';
  const [viewingRole, setViewingRole] = useState(currentRole);

  useEffect(() => {
    // Sub-CFO and Asst-CFOs behave as department users for the CFO section
    setViewingRole((currentRole === 'sub_cfo' || currentRole?.startsWith('sub_cfo_')) ? 'cfo' : currentRole);
    // File viewer only gets the view_only tab
    if (isFileViewer) {
      setActiveTab('view_only');
    }
  }, [currentRole, isFileViewer]);

  const isCFORole = currentRole === 'cfo' || currentRole === 'sub_cfo' || currentRole?.startsWith('sub_cfo_') || currentRole === 'admin' || isAdmin;

  // New Form State
  const [isSavingForm, setIsSavingForm] = useState(false);
  const [formData, setFormData] = useState({
    cfo_diary_number: `CFO-${new Date().getFullYear()}-${String(Math.floor(1 + Math.random() * 9999)).padStart(4, '0')}`,
    inward_date: getLocalDateString(),
    registration_date: getLocalDateString(),
    print_date: getLocalDateString(),
    received_from: "",
    receiving_number: `RC-${Math.floor(1000 + Math.random() * 9000)}`,
    mainCategory: "",
    subCategory: "",
    subject: "",
    date_of_sign: getLocalDateString(),
    signature_data: "",
    mark_to: "",
    outward_date: getLocalDateString(),
    amount: 0,
    remarks: "",
    employee_number: "",
    voucher_code: "",
    vehicle_no: "",
  });

  const [notifications, setNotifications] = useState<any[]>([]);
  const [reportDateFilter, setReportDateFilter] = useState("today");
  const [customFilterStartDate, setCustomFilterStartDate] = useState("");
  const [customFilterEndDate, setCustomFilterEndDate] = useState("");
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [selectedRecordIds, setSelectedRecordIds] = useState<string[]>([]);
  const [empSuggestions, setEmpSuggestions] = useState<any[]>([]);
  const [showEmpSuggestions, setShowEmpSuggestions] = useState(false);
  const [selectedEmpProfile, setSelectedEmpProfile] = useState<any>(null);
  const [isSearchingEmp, setIsSearchingEmp] = useState(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);
  const [deletePassword, setDeletePassword] = useState("");

  const handleDeleteRecord = async () => {
    if (!verifyPassword(deletePassword)) {
      toast.error("Incorrect password. Deletion failed.");
      return;
    }
    if (!recordToDelete) return;

    try {
      const { error } = await supabase
        .from('file_tracking_records' as any)
        .delete()
        .eq('id', recordToDelete);

      if (error) throw error;
      
      // Log delete activity
      const deletedRecord = records.find(r => r.id === recordToDelete);
      logActivity({
        userRole: currentRole || 'unknown',
        userName: userName || sections.find(s => s.id === currentRole)?.name || currentRole || 'Unknown',
        action: 'DELETE',
        recordId: recordToDelete,
        diaryNumber: deletedRecord?.cfo_diary_number,
        receivingNumber: deletedRecord?.receiving_number,
        subject: deletedRecord?.subject,
      });

      toast.success("Record deleted successfully.");
      setIsDeleteModalOpen(false);
      setDeletePassword("");
      setRecordToDelete(null);
      fetchRecords(currentPage);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete record");
    }
  };

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [recordToEdit, setRecordToEdit] = useState<any>(null);
  const [editPassword, setEditPassword] = useState("");
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);

  // My Tray local search
  const [traySearchQuery, setTraySearchQuery] = useState("");

  // CFO Diary register tab search
  const [cfoDiarySearchQuery, setCfoDiarySearchQuery] = useState("");
  const [isCfoDiarySearching, setIsCfoDiarySearching] = useState(false);

  const handleCfoDiarySearch = async () => {
    if (!cfoDiarySearchQuery.trim()) return;
    setIsCfoDiarySearching(true);
    try {
      const { data, error } = await supabase
        .from('file_tracking_records' as any)
        .select('*')
        .or(`cfo_diary_number.ilike.%${cfoDiarySearchQuery.trim()}%,receiving_number.ilike.%${cfoDiarySearchQuery.trim()}%,subject.ilike.%${cfoDiarySearchQuery.trim()}%`)
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setRecordToEdit(data);
        setIsEditModalOpen(true);
        setCfoDiarySearchQuery("");
      } else {
        toast.error("No record found with this CFO Diary / Receiving Number.");
      }
    } catch (err: any) {
      toast.error(err.message || "Search failed");
    } finally {
      setIsCfoDiarySearching(false);
    }
  };

  const handleEditRecordAuth = () => {
    if (!verifyPassword(editPassword)) {
      toast.error("Incorrect password. Edit access denied.");
      return;
    }
    if (!recordToEdit) return;

    setIsEditModalOpen(false);
    setEditPassword("");
    
    setActiveTab("register");
    setFormData({
      ...formData,
      cfo_diary_number: recordToEdit.cfo_diary_number,
      inward_date: recordToEdit.inward_date || getLocalDateString(),
      registration_date: recordToEdit.created_at ? getLocalDateString(recordToEdit.created_at) : getLocalDateString(),
      print_date: recordToEdit.created_at ? getLocalDateString(recordToEdit.created_at) : getLocalDateString(),
      received_from: recordToEdit.received_from || "",
      receiving_number: recordToEdit.receiving_number,
      mainCategory: recordToEdit.mainCategory || recordToEdit.main_category || "",
      subCategory: recordToEdit.subCategory || recordToEdit.sub_category || "",
      subject: recordToEdit.subject || "",
      amount: recordToEdit.amount || 0,
      remarks: recordToEdit.remarks || "",
      mark_to: recordToEdit.mark_to || "cfo",
      signature_data: recordToEdit.signature_data || "",
      employee_number: recordToEdit.employee_number || "",
      voucher_code: recordToEdit.voucher_code || "",
      vehicle_no: recordToEdit.vehicle_no || "",
      date_of_sign: recordToEdit.date_of_sign || getLocalDateString(),
      outward_date: recordToEdit.outward_date || getLocalDateString(),
    });
    setIsEditingMode(true);
    setEditingRecordId(recordToEdit.id);
    setIsForwardingMode(false);
    toast.info(`Editing record: ${recordToEdit.subject}`);
  };

  const fetchNextDiaryNumber = async () => {
    const year = new Date().getFullYear();
    const { data, error } = await supabase
      .from('file_tracking_records' as any)
      .select('cfo_diary_number, created_at')
      .like('cfo_diary_number', `CFO-${year}-%`)
      .order('created_at', { ascending: false })
      .limit(10);

    if (!error && data && data.length > 0) {
      // Extract numeric parts and find the actual maximum to handle string sorting edge cases
      const numericParts = data
        .map(d => {
          const parts = d.cfo_diary_number.split('-');
          return parts.length >= 3 ? parseInt(parts[2]) : 0;
        })
        .filter(n => !isNaN(n));

      if (numericParts.length > 0) {
        const maxNo = Math.max(...numericParts);
        const nextNo = `CFO-${year}-${String(maxNo + 1).padStart(4, '0')}`;
        setFormData(prev => ({ ...prev, cfo_diary_number: nextNo }));
      } else {
        setFormData(prev => ({ ...prev, cfo_diary_number: `CFO-${year}-0001` }));
      }
    } else {
      setFormData(prev => ({ ...prev, cfo_diary_number: `CFO-${year}-0001` }));
    }
  };

  useEffect(() => {
    if (activeTab === 'register' && !isForwardingMode && !isEditingMode) {
      fetchNextDiaryNumber();
    }
  }, [activeTab, isForwardingMode, isEditingMode]);

  const [records, setRecords] = useState<any[]>([]);

  // Helper for CSV Export
  const subCatReadable = (val: string | null | undefined) => {
    if (!val) return "---";
    return val.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  };

  const mainCatReadable = (val: string | null | undefined) => {
    if (!val) return "---";
    return val.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  };

  const exportToCSV = (data: any[], filename: string, rangeLabel?: string, filterInfo?: string) => {
    if (data.length === 0) return;
    const headers = [
      "S#", "Diary No", "Ref No", "Inward Date", "Subject", "Amount",
      "Main Category", "Sub Category", "Employee No", "Voucher Code", "Vehicle No",
      "Received From", "Mark To", "Outward Date", "Reg. Date", "Remarks"
    ];
    const rows = data.map((r, idx) => [
      idx + 1,
      r.cfo_diary_number || "",
      r.receiving_number || "",
      r.inward_date ? new Date(r.inward_date).toLocaleDateString() : "",
      (r.subject || "").replace(/,/g, " "),
      r.amount || 0,
      mainCatReadable(r.mainCategory || r.main_category).toUpperCase(),
      subCatReadable(r.subCategory || r.sub_category),
      r.employee_number || "",
      r.voucher_code || "",
      r.vehicle_no || "",
      (r.received_from || "").replace(/,/g, " "),
      r.mark_to || "",
      r.outward_date ? new Date(r.outward_date).toLocaleDateString() : "",
      r.created_at ? new Date(r.created_at).toLocaleDateString() : "",
      (r.remarks || "").replace(/,/g, " ")
    ]);

    let csvContent = "KARACHI WATER & SEWERAGE CORPORATION,,,,,,,,,,,,,,\n";
    csvContent += "Finance Department - File Movement Tracking Report,,,,,,,,,,,,,,\n";
    if (rangeLabel) {
      csvContent += `Report Period: ${rangeLabel.replace(/,/g, " ")},,,,,,,,,,,,,,\n`;
    }
    if (filterInfo) {
      csvContent += `Filter: ${filterInfo.replace(/,/g, " ")},,,,,,,,,,,,,,\n`;
    }
    csvContent += `Generated At: ${new Date().toLocaleString()},,,,,,,,,,,,,,\n`;
    csvContent += `Total Records: ${data.length},,,,,,,,,,,,,,\n\n`;
    csvContent += [headers, ...rows].map(e => e.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper for Professional PDF Export (Print-based)
  const handlePrintFullReport = (data: any[]) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    let dateRangeLabel = "All Time Records";
    if (reportDateFilter === 'today' || reportDateFilter === 'daily') {
      dateRangeLabel = `Daily (Today: ${new Date().toLocaleDateString()})`;
    } else if (reportDateFilter === 'weekly') {
      dateRangeLabel = "Last 7 Days";
    } else if (reportDateFilter === 'monthly') {
      dateRangeLabel = "Last 30 Days";
    } else if (reportDateFilter === 'yearly') {
      dateRangeLabel = "Last 1 Year";
    } else if (reportDateFilter === 'custom') {
      const fromStr = customFilterStartDate ? new Date(customFilterStartDate).toLocaleDateString() : "Beginning";
      const toStr = customFilterEndDate ? new Date(customFilterEndDate).toLocaleDateString() : "Present";
      dateRangeLabel = `${fromStr} to ${toStr}`;
    }

    const categoryLabel = filterCategory === 'all' ? 'All Categories' : filterCategory.toUpperCase();
    const subCategoryLabel = filterSubCategory === 'all'
      ? (filterCategory !== 'all' ? `All ${filterCategory.toUpperCase()} Sub-Categories` : 'All Sub-Categories')
      : subCatReadable(filterSubCategory);

    const reportRows = data.map((r, i) => `
      <tr>
        <td>${i + 1}</td>
        <td><strong>${r.cfo_diary_number || '---'}</strong><br/><span style="font-size:9px;color:#666">${r.receiving_number || ''}</span></td>
        <td>${r.inward_date ? new Date(r.inward_date).toLocaleDateString() : '---'}</td>
        <td style="max-width:160px">${r.subject || '---'}</td>
        <td style="text-align:right;white-space:nowrap">${formatCurrency(r.amount || 0)}</td>
        <td>
          <div style="font-weight: bold; text-transform: uppercase; color: #1e40af; font-size:10px;">${mainCatReadable(r.mainCategory || r.main_category)}</div>
          ${(r.subCategory || r.sub_category) ? `<div style="font-size: 9px; color: #555; text-transform: uppercase; margin-top: 2px; font-style: italic;">${subCatReadable(r.subCategory || r.sub_category)}</div>` : ''}
        </td>
        <td>${r.received_from || '---'}</td>
        <td>
          ${r.employee_number ? `<div style="font-size:9px"><b>Emp#:</b> ${r.employee_number}</div>` : ''}
          ${r.voucher_code ? `<div style="font-size:9px"><b>Vchr:</b> ${r.voucher_code}</div>` : ''}
          ${r.vehicle_no ? `<div style="font-size:9px"><b>Veh:</b> ${r.vehicle_no}</div>` : ''}
          ${(!r.employee_number && !r.voucher_code && !r.vehicle_no) ? '---' : ''}
        </td>
        <td>${sections.find(s => s.id === r.mark_to)?.name || r.mark_to || '---'}</td>
        <td style="white-space:nowrap">${r.outward_date ? new Date(r.outward_date).toLocaleDateString() : '---'}</td>
        <td style="max-width:120px;font-size:9px;color:#555">${r.remarks || '---'}</td>
      </tr>
    `).join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>KWSC - Finance Tracking Report</title>
          <style>
            @page { size: A4 landscape; margin: 15mm; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #333; font-size: 11px; }
            .report-header { text-align: center; border-bottom: 3px solid #1e40af; padding-bottom: 16px; margin-bottom: 20px; }
            .logo { font-size: 20px; font-weight: bold; color: #1e40af; margin-bottom: 4px; }
            .report-title { font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #333; font-weight: bold; }
            .meta-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; font-size: 11px; margin-bottom: 12px; padding: 12px; background: #f8fafc; border-radius: 6px; border: 1px solid #e2e8f0; }
            .meta-item { display: flex; flex-direction: column; }
            .meta-label { font-size: 9px; text-transform: uppercase; color: #94a3b8; font-weight: bold; letter-spacing: 0.05em; margin-bottom: 2px; }
            .meta-value { font-weight: bold; color: #1e293b; }
            .filter-bar { display: flex; gap: 12px; align-items: center; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 8px 12px; margin-bottom: 14px; font-size: 10px; flex-wrap: wrap; }
            .filter-tag { background: #1e40af; color: white; border-radius: 4px; padding: 2px 8px; font-weight: bold; text-transform: uppercase; font-size: 9px; }
            table { width: 100%; border-collapse: collapse; margin-top: 6px; }
            th, td { border: 1px solid #e2e8f0; padding: 7px 8px; text-align: left; font-size: 10px; vertical-align: top; }
            th { background-color: #1e40af !important; font-weight: bold; text-transform: uppercase; color: white; font-size: 9px; letter-spacing: 0.05em; }
            tr:nth-child(even) { background-color: #f8fafc; }
            tr:hover { background-color: #eff6ff; }
            .signature-section { margin-top: 40px; display: flex; justify-content: space-between; }
            .sig-box { border-top: 2px solid #1e40af; width: 200px; text-align: center; padding-top: 8px; font-size: 11px; font-weight: bold; color: #1e40af; }
            .total-row { background: #dbeafe !important; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="report-header">
            <div class="logo">KARACHI WATER &amp; SEWERAGE CORPORATION</div>
            <div class="report-title">Finance Department &mdash; File Movement Tracking Report</div>
          </div>

          <div class="meta-grid">
            <div class="meta-item">
              <span class="meta-label">Generated By</span>
              <span class="meta-value">${userName || currentRole.toUpperCase()}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Date Range</span>
              <span class="meta-value">${dateRangeLabel}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Generated At</span>
              <span class="meta-value">${new Date().toLocaleString()}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Category Filter</span>
              <span class="meta-value">${categoryLabel}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Sub-Category Filter</span>
              <span class="meta-value">${subCategoryLabel}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Total Records</span>
              <span class="meta-value">${data.length}</span>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>S#</th>
                <th>Diary No / Ref No</th>
                <th>Inward Date</th>
                <th>Subject</th>
                <th>Amount</th>
                <th>Category / Sub-Category</th>
                <th>Received From</th>
                <th>Emp# / Vchr / Veh</th>
                <th>Forwarded To</th>
                <th>Outward Date</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              ${reportRows}
            </tbody>
          </table>

          <div class="signature-section">
            <div class="sig-box">Section Head Signature</div>
            <div class="sig-box">CFO / Administrator</div>
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Comprehensive Database Schema Reference for file_tracking_records:

  /* 
    SUPABASE SQL SCHEMA FOR file_tracking_records:
    
    CREATE TABLE file_tracking_records (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      tracking_id TEXT UNIQUE NOT NULL,
      cfo_diary_number TEXT,
      inward_date DATE,
      received_from TEXT,
      receiving_number TEXT UNIQUE,
      main_category TEXT,
      sub_category TEXT,
      subject TEXT,
      date_of_sign DATE,
      signature_data TEXT,
      mark_to TEXT,
      outward_date DATE,
      remarks TEXT,
      amount NUMERIC DEFAULT 0,
      history JSONB DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ DEFAULT now()
    );
  */

  const [isSignDialogOpen, setIsSignDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [isJourneyMapOpen, setIsJourneyMapOpen] = useState(false);
  const [qrFullScreen, setQrFullScreen] = useState<{ diary: string, receiving: string, print_date?: string, created_date?: string } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.beginPath();
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let x, y;

    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0ea5e9'; // primary color

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      // Check if canvas is empty (simplified check)
      const dataUrl = canvas.toDataURL();
      setFormData(prev => ({ ...prev, signature_data: dataUrl }));
      setIsSignDialogOpen(false);
      toast.success("E-Signature captured successfully");
    }
  };

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData(prev => ({ ...prev, signature_data: event.target?.result as string }));
        setIsSignDialogOpen(false);
        toast.success("Signature image uploaded successfully");
      };
      reader.readAsDataURL(file);
    }
  };

  // Dynamic config from Supabase (replaces hardcoded categoryOptions & sections)
  const { mainCategories: dynMainCats, subCategories: dynSubCats, sections: dynSections } = useAppConfig();

  // Legacy format for backward compatibility
  const categoryOptions: Record<string, string[]> = dynMainCats.reduce((acc, mc) => {
    acc[mc.config_key] = getSubCategoriesFor(dynSubCats, mc.config_key).map(sc => sc.config_label);
    return acc;
  }, {} as Record<string, string[]>);

  // Sub-cat key lookup: label → key (needed for form saving)
  const subCatLabelToKey = (label: string, parentKey: string): string => {
    const found = dynSubCats.find(sc => sc.parent_key === parentKey && sc.config_label === label);
    return found ? found.config_key : label.toLowerCase().replace(/ /g, '_');
  };
  const handleFormReset = () => {
    // Trigger the useEffect above to fetch next number after reset
    setIsForwardingMode(false);
    setIsEditingMode(false);
    setEditingRecordId(null);
    // Setting a temporary random one which will be overwritten by the useEffect if needed
    setFormData({
      cfo_diary_number: `CFO-${new Date().getFullYear()}-${String(Math.floor(1 + Math.random() * 9999)).padStart(4, '0')}`,
      inward_date: getLocalDateString(),
      registration_date: getLocalDateString(),
      print_date: getLocalDateString(),
      received_from: "",
      receiving_number: `RC-${Math.floor(1000 + Math.random() * 9000)}`,
      mainCategory: "",
      subCategory: "",
      subject: "",
      date_of_sign: getLocalDateString(),
      signature_data: "",
      mark_to: "",
      outward_date: getLocalDateString(),
      amount: 0,
      remarks: "",
      employee_number: "",
      voucher_code: "",
      vehicle_no: "",
    });
    setSelectedEmpProfile(null);
    setEmpSuggestions([]);
    setShowEmpSuggestions(false);
  };

  const handleEmployeeNumberChange = async (val: string) => {
    setFormData(prev => ({ ...prev, employee_number: val }));
    if (val.trim().length < 2) {
      setEmpSuggestions([]);
      setShowEmpSuggestions(false);
      return;
    }
    
    setIsSearchingEmp(true);
    try {
      const term = `%${val.trim()}%`;
      const { data, error } = await supabase
        .from('book_section_employees')
        .select('*')
        .or(`employee_no.ilike.${term},pension_no.ilike.${term},full_name.ilike.${term}`)
        .limit(10);
      
      if (!error && data) {
        setEmpSuggestions(data);
        setShowEmpSuggestions(data.length > 0);
      }
    } catch (err) {
      console.error("Employee autocomplete search failed:", err);
    } finally {
      setIsSearchingEmp(false);
    }
  };

  const handleSelectEmployee = (emp: any) => {
    const readableSubCat = emp.sub_category_regular || emp.sub_category_retired || "Claim";
    const subCatLabel = getSubCatLabel(readableSubCat);
    
    setFormData(prev => ({
      ...prev,
      employee_number: emp.employee_no || emp.pension_no || "",
      received_from: emp.full_name || "",
      amount: emp.cheque_amount || emp.total_amount || 0,
      subject: `Claim under ${subCatLabel}`
    }));
    
    setSelectedEmpProfile(emp);
    setShowEmpSuggestions(false);
    toast.success(`Verified Employee: ${emp.full_name}`);
  };

  const handleSaveForm = async () => {
    const isSubCategoryRequired = formData.mainCategory !== 'impress' && formData.mainCategory !== 'pol_bills';
    if (!formData.cfo_diary_number || !formData.received_from || !formData.receiving_number || !formData.subject || !formData.mainCategory || (isSubCategoryRequired && !formData.subCategory) || !formData.mark_to) {
      toast.error("Please fill all required fields");
      return;
    }
    setIsSavingForm(true);

    if (!navigator.onLine) {
      const snapshot = {
        ...formData,
        date: new Date().toISOString(),
        processed_by: sections.find(s => s.id === currentRole)?.name,
        action: isEditingMode ? "EDITED" : (isForwardingMode ? "FORWARDED" : "REGISTERED"),
        amount: formData.amount
      };

      if (isEditingMode) {
        addToOfflineQueue('file_tracking_records', 'UPDATE', { id: editingRecordId, ...formData });
      } else if (isForwardingMode) {
        const existingLocal = records.find(r => r.receiving_number === formData.receiving_number);
        const newHistory = existingLocal ? [...(existingLocal.history || []), snapshot] : [snapshot];
        addToOfflineQueue('file_tracking_records', 'UPDATE', { receiving_number: formData.receiving_number, ...formData, history: newHistory });
      } else {
        const trackingId = `FT-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
        const newEntry = { ...formData, tracking_id: trackingId, history: [snapshot], created_at: new Date().toISOString() };
        addToOfflineQueue('file_tracking_records', 'INSERT', newEntry);
      }
      toast.success("Saved offline! Will sync when internet is restored.");
      handleFormReset();
      setIsSavingForm(false);
      return;
    }

    let dbError = null;
    try {
      // 1. Fetch existing record from DB directly (to handle pagination)
      const { data: existingRecord, error: fetchError } = await supabase
        .from('file_tracking_records' as any)
        .select('*')
        .eq('receiving_number', formData.receiving_number)
        .maybeSingle();

      if (fetchError) throw fetchError;

      const snapshot = {
        ...formData,
        date: new Date().toISOString(),
        processed_by: sections.find(s => s.id === currentRole)?.name,
        action: isEditingMode ? "EDITED" : (isForwardingMode ? "FORWARDED" : "REGISTERED"),
        amount: formData.amount
      };

      if (isEditingMode) {
        const { error } = await supabase
          .from('file_tracking_records' as any)
          .update({
            cfo_diary_number: formData.cfo_diary_number,
            inward_date: formData.inward_date,
            received_from: formData.received_from,
            receiving_number: formData.receiving_number,
            main_category: formData.mainCategory,
            sub_category: formData.subCategory,
            subject: formData.subject,
            date_of_sign: formData.date_of_sign,
            signature_data: formData.signature_data,
            mark_to: formData.mark_to,
            outward_date: formData.outward_date,
            remarks: formData.remarks,
            amount: formData.amount,
            employee_number: formData.employee_number,
            voucher_code: formData.voucher_code,
            vehicle_no: formData.vehicle_no,
            print_date: formData.print_date || getLocalDateString(),
            created_at: formData.registration_date
              ? new Date(formData.registration_date + 'T00:00:00').toISOString()
              : undefined,
          })
          .eq('id', editingRecordId);
          
        dbError = error;
        if (error) {
          toast.error(`Database Error: Data could not be updated. ${error.message || ""}`);
        } else {
          logActivity({
            userRole: currentRole || 'unknown',
            userName: userName || sections.find(s => s.id === currentRole)?.name || currentRole || 'Unknown',
            action: 'EDIT',
            recordId: editingRecordId || undefined,
            diaryNumber: formData.cfo_diary_number,
            receivingNumber: formData.receiving_number,
            subject: formData.subject,
            details: { updated_fields: ['multiple'] }
          });
          toast.success("Record updated successfully!");
          setQrFullScreen({ diary: formData.cfo_diary_number, receiving: formData.receiving_number, print_date: formData.print_date });
          handleFormReset();
          fetchRecords(0);
        }
      } else if (isForwardingMode) {
        if (!existingRecord) {
          toast.error("Original record not found for forwarding. Please verify the receiving number.");
          setIsSavingForm(false);
          return;
        }

        // Appending to existing file history
        const newHistory = [...((existingRecord as any).history || []), snapshot];

        const { error } = await supabase
          .from('file_tracking_records' as any)
          .update({
            mark_to: formData.mark_to,
            remarks: formData.remarks,
            subject: formData.subject,
            main_category: formData.mainCategory,
            sub_category: formData.subCategory,
            received_from: formData.received_from,
            amount: formData.amount,
            employee_number: formData.employee_number,
            voucher_code: formData.voucher_code,
            vehicle_no: formData.vehicle_no,
            history: newHistory
          })
          .eq('receiving_number', formData.receiving_number);

        dbError = error;
        if (error) {
          toast.error(`Database Error: Data could not be saved. ${error.message || ""}`);
        } else {
          logActivity({
            userRole: currentRole || 'unknown',
            userName: userName || sections.find(s => s.id === currentRole)?.name || currentRole || 'Unknown',
            action: 'FORWARD',
            recordId: (existingRecord as any)?.id,
            diaryNumber: formData.cfo_diary_number,
            receivingNumber: formData.receiving_number,
            subject: formData.subject,
            details: { mark_to: formData.mark_to }
          });
          toast.success(`Detailed log entry added and file forwarded to ${formData.mark_to}`);
          setQrFullScreen({ diary: formData.cfo_diary_number, receiving: formData.receiving_number, print_date: formData.print_date });
          handleFormReset();
          fetchRecords(0); // Fresh data from Supabase
        }
      } else {
        // Creating fresh record
        // Check for duplicate CFO Diary Number
        const { data: diaryExists, error: diaryError } = await supabase
          .from('file_tracking_records' as any)
          .select('id')
          .eq('cfo_diary_number', formData.cfo_diary_number)
          .limit(1);

        if (diaryExists && diaryExists.length > 0) {
          toast.error(`CFO Diary Number ${formData.cfo_diary_number} already exists! Please use a unique number.`);
          setIsSavingForm(false);
          return;
        }

        if (existingRecord) {
          toast.error("This Receiving Number already exists! Please use a unique number for new registration.");
          setIsSavingForm(false);
          return;
        }

        const trackingId = `FT-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
        const newEntry = {
          tracking_id: trackingId,
          cfo_diary_number: formData.cfo_diary_number,
          inward_date: formData.inward_date,
          received_from: formData.received_from,
          receiving_number: formData.receiving_number,
          main_category: formData.mainCategory,
          sub_category: formData.subCategory,
          subject: formData.subject,
          date_of_sign: formData.date_of_sign,
          signature_data: formData.signature_data,
          mark_to: formData.mark_to,
          outward_date: formData.outward_date,
          remarks: formData.remarks,
          amount: formData.amount,
          employee_number: formData.employee_number,
          voucher_code: formData.voucher_code,
          vehicle_no: formData.vehicle_no,
          print_date: formData.print_date || getLocalDateString(),
          history: [snapshot],
          created_at: formData.registration_date
            ? new Date(formData.registration_date + 'T00:00:00').toISOString()
            : new Date().toISOString()
        };

        const { error } = await supabase.from('file_tracking_records' as any).insert(newEntry);
        dbError = error;

        if (error) {
          toast.error(`Database Error: Entry could not be saved. ${error.message || ""}`);
        } else {
          // Local state ONLY updated if DB insert was successful
          const fullEntry = {
            ...newEntry,
            mainCategory: formData.mainCategory,
            subCategory: formData.subCategory,
            id: Math.random().toString(36).substr(2, 9),
          };
          setRecords([fullEntry, ...records]);

          logActivity({
            userRole: currentRole || 'unknown',
            userName: userName || sections.find(s => s.id === currentRole)?.name || currentRole || 'Unknown',
            action: 'REGISTER',
            recordId: undefined, // Freshly created, but we don't have UUID back easily without extra select
            diaryNumber: formData.cfo_diary_number,
            receivingNumber: formData.receiving_number,
            subject: formData.subject,
            details: { mark_to: formData.mark_to, amount: formData.amount }
          });

          toast.success(`File registered and initial audit log created`);
          setQrFullScreen({ diary: formData.cfo_diary_number, receiving: formData.receiving_number, print_date: formData.print_date });
          handleFormReset();
          fetchRecords(0); // Fresh data Supabase se
        }
      }

      if (dbError) {
        console.warn("Table file_tracking_records sync issue:", dbError);
      }
    } catch (err) {
      console.error(err);
      toast.error("Error saving record");
    } finally {
      setIsSavingForm(false);
    }
  };

  const [isPrintingQR, setIsPrintingQR] = useState(false);
  const [isPrintingQRMinimal, setIsPrintingQRMinimal] = useState(false);
  const [isPrintingCovering, setIsPrintingCovering] = useState(false);

  const handlePrintQR = () => {
    setIsPrintingQR(true);
    document.body.classList.add('printing-qr-ticket');
    setTimeout(() => {
      window.print();
      document.body.classList.remove('printing-qr-ticket');
      setIsPrintingQR(false);
    }, 250);
  };

  const handlePrintQRMinimal = () => {
    setIsPrintingQRMinimal(true);
    document.body.classList.add('thermal-mode');
    setTimeout(() => {
      window.print();
      document.body.classList.remove('thermal-mode');
      setIsPrintingQRMinimal(false);
    }, 250);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const target = e.target as HTMLElement;
      if (target.tagName.toLowerCase() === 'button') return; // Let buttons act naturally

      e.preventDefault();
      const formContainer = document.getElementById('registration-form-container');
      if (!formContainer) return;

      const focusableElements = Array.from(
        formContainer.querySelectorAll('input:not([readonly]):not([disabled]), button[role="combobox"]:not([disabled]), textarea:not([disabled])')
      );

      const index = focusableElements.indexOf(target);
      if (index > -1 && index < focusableElements.length - 1) {
        (focusableElements[index + 1] as HTMLElement).focus();
      }
    }
  };

  useEffect(() => {
    setCurrentPage(0);
  }, [filterCategory, filterSubCategory, filterSection, filterStatus, sortOrder, searchQuery, activeTab, viewingRole, reportDateFilter, customFilterStartDate, customFilterEndDate]);

  const fetchRecords = async (page = 0) => {
    setIsLoading(true);
    
    // Check if offline to load from cache immediately
    if (!navigator.onLine) {
      try {
        const cached = localStorage.getItem('kwsc_cached_records');
        if (cached) {
          const parsed = JSON.parse(cached);
          setRecords(parsed);
          setTotalRecords(parsed.length);
          toast.info('Loaded offline cached data');
        }
      } catch (e) {}
      setIsLoading(false);
      return;
    }

    try {
      const from = page * DB_PAGE_SIZE;
      const to = from + DB_PAGE_SIZE - 1;

      let query = supabase
        .from('file_tracking_records' as any)
        .select(
          'id, tracking_id, cfo_diary_number, inward_date, received_from, receiving_number, main_category, sub_category, subject, mark_to, outward_date, remarks, amount, created_at, history, employee_number, voucher_code, vehicle_no, print_date, date_of_sign, signature_data',
          { count: 'exact' }
        );

      // Apply Role-based filtering at the DB level
      if (activeTab === 'tray' || activeTab === 'timeline') {
        const effectiveRole = effectiveViewingRole;
        if (!(currentRole === 'cfo' || isAdmin)) {
          if (activeTab === 'tray') {
            query = query.eq('mark_to', effectiveRole);
          } else {
            query = query.or(`mark_to.eq.${effectiveRole},history.cs.[{"processed_by":"${sections.find(s => s.id === effectiveRole)?.name}"}]`);
          }
        } else if (currentRole === 'cfo' || isAdmin) {
          if (activeTab === 'tray') {
            query = query.eq('mark_to', effectiveRole);
          }
        }
      } else if (activeTab === 'cfo_all_files') {
        if (filterStatus === 'exited') {
          query = query.eq('mark_to', 'exited');
        } else {
          query = query.neq('mark_to', 'exited');
        }
      }

      // Apply Category filter
      if (filterCategory !== 'all') {
        query = query.eq('main_category', filterCategory);
      }

      // Apply Sub-Category filter
      if (filterSubCategory !== 'all') {
        query = query.eq('sub_category', filterSubCategory);
      }

      // Apply Section filter
      if (filterSection !== 'all') {
        query = query.eq('mark_to', filterSection);
      }

      // Apply Date filter
      if (reportDateFilter !== 'all') {
        const now = new Date();
        let startDate: Date | null = null;
        let endDate: Date | null = null;

        if (reportDateFilter === 'today' || reportDateFilter === 'daily') {
          startDate = new Date(now.setHours(0, 0, 0, 0));
        } else if (reportDateFilter === 'weekly') {
          startDate = new Date(now.setDate(now.getDate() - 7));
        } else if (reportDateFilter === 'monthly') {
          startDate = new Date(now.setMonth(now.getMonth() - 1));
        } else if (reportDateFilter === 'yearly') {
          startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        } else if (reportDateFilter === 'custom') {
          if (customFilterStartDate) {
            startDate = new Date(customFilterStartDate);
            startDate.setHours(0, 0, 0, 0);
          }
          if (customFilterEndDate) {
            endDate = new Date(customFilterEndDate);
            endDate.setHours(23, 59, 59, 999);
          }
        }

        if (startDate) {
          query = query.gte('created_at', startDate.toISOString());
        }
        if (endDate) {
          query = query.lte('created_at', endDate.toISOString());
        }
      }

      // Apply Search filter
      if (searchQuery) {
        const q = `%${searchQuery.toLowerCase()}%`;
        query = query.or(`cfo_diary_number.ilike.${q},receiving_number.ilike.${q},subject.ilike.${q},received_from.ilike.${q},tracking_id.ilike.${q}`);
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: sortOrder === 'asc' })
        .range(from, to);

      if (error) throw error;

      if (data) {
        const mappedData = (data as any[]).map(d => ({
          ...d,
          mainCategory: d.main_category,
          subCategory: d.sub_category,
        }));
        setRecords(mappedData);
        setTotalRecords(count || 0);
        setCurrentPage(page);
        try { localStorage.setItem('kwsc_cached_records', JSON.stringify(mappedData)); } catch(e) {}
      }
    } catch (err) {
      console.error("Fetch error:", err);

    } finally {
      setIsLoading(false);
      setIsInitialLoading(false);
    }
  };

  const handleBulkExport = async (format: 'csv' | 'pdf') => {
    setIsLoading(true);
    toast.info(`Fetching all records for ${format.toUpperCase()} export...`);
    try {
      const sectionName = sections.find(s => s.id === effectiveViewingRole)?.name || effectiveViewingRole;

      let query = supabase
        .from('file_tracking_records' as any)
        .select(
          'id, tracking_id, cfo_diary_number, inward_date, received_from, receiving_number, main_category, sub_category, subject, mark_to, outward_date, remarks, amount, created_at, employee_number, voucher_code, vehicle_no'
        );

      // Apply same filters as fetchRecords
      if (activeTab === 'tray' || activeTab === 'timeline') {
        const effectiveRole = effectiveViewingRole;
        if (!(currentRole === 'cfo' || isAdmin)) {
          if (activeTab === 'tray') {
            query = query.eq('mark_to', effectiveRole);
          } else {
            query = query.or(`mark_to.eq.${effectiveRole},history.cs.[{"processed_by":"${sectionName}"}]`);
          }
        } else if (currentRole === 'cfo' || isAdmin) {
          if (activeTab === 'tray') {
            query = query.eq('mark_to', effectiveRole);
          }
        }
      } else if (activeTab === 'cfo_all_files') {
        if (filterStatus === 'exited') {
          query = query.eq('mark_to', 'exited');
        } else {
          query = query.neq('mark_to', 'exited');
        }
      }

      if (filterCategory !== 'all') {
        query = query.eq('main_category', filterCategory);
      }

      if (filterSubCategory !== 'all') {
        query = query.eq('sub_category', filterSubCategory);
      }

      if (filterSection !== 'all') {
        query = query.eq('mark_to', filterSection);
      }

      if (reportDateFilter !== 'all') {
        const now = new Date();
        let startDate: Date | null = null;
        let endDate: Date | null = null;

        if (reportDateFilter === 'today' || reportDateFilter === 'daily') {
          startDate = new Date(now.setHours(0, 0, 0, 0));
        } else if (reportDateFilter === 'weekly') {
          startDate = new Date(now.setDate(now.getDate() - 7));
        } else if (reportDateFilter === 'monthly') {
          startDate = new Date(now.setMonth(now.getMonth() - 1));
        } else if (reportDateFilter === 'yearly') {
          startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        } else if (reportDateFilter === 'custom') {
          if (customFilterStartDate) {
            startDate = new Date(customFilterStartDate);
            startDate.setHours(0, 0, 0, 0);
          }
          if (customFilterEndDate) {
            endDate = new Date(customFilterEndDate);
            endDate.setHours(23, 59, 59, 999);
          }
        }

        if (startDate) {
          query = query.gte('created_at', startDate.toISOString());
        }
        if (endDate) {
          query = query.lte('created_at', endDate.toISOString());
        }
      }

      if (searchQuery) {
        const q = `%${searchQuery.toLowerCase()}%`;
        query = query.or(`cfo_diary_number.ilike.${q},receiving_number.ilike.${q},subject.ilike.${q},received_from.ilike.${q},tracking_id.ilike.${q}`);
      }

      const { data, error } = await query.order('created_at', { ascending: sortOrder === 'asc' });

      if (error) throw error;

      if (data && data.length > 0) {
        const mappedData = (data as any[]).map(d => ({
          ...d,
          mainCategory: d.main_category,
          subCategory: d.sub_category,
        }));

        let dateRangeLabel = "All Time Records";
        if (reportDateFilter === 'today' || reportDateFilter === 'daily') {
          dateRangeLabel = `Daily (Today: ${new Date().toLocaleDateString()})`;
        } else if (reportDateFilter === 'weekly') {
          dateRangeLabel = "Last 7 Days";
        } else if (reportDateFilter === 'monthly') {
          dateRangeLabel = "Last 30 Days";
        } else if (reportDateFilter === 'yearly') {
          dateRangeLabel = "Last 1 Year";
        } else if (reportDateFilter === 'custom') {
          const fromStr = customFilterStartDate ? new Date(customFilterStartDate).toLocaleDateString() : "Beginning";
          const toStr = customFilterEndDate ? new Date(customFilterEndDate).toLocaleDateString() : "Present";
          dateRangeLabel = `${fromStr} to ${toStr}`;
        }

        if (format === 'csv') {
          let rangeName = "";
          if (reportDateFilter === 'custom') {
            const start = customFilterStartDate || "Start";
            const end = customFilterEndDate || "End";
            rangeName = `_range_${start}_to_${end}`;
          } else {
            rangeName = `_${reportDateFilter}`;
          }
          const catLabel = filterCategory === 'all' ? 'All' : filterCategory.toUpperCase();
          const subCatLabel = filterSubCategory === 'all'
            ? (filterCategory !== 'all' ? `All ${filterCategory.toUpperCase()} Sub-Categories` : 'All Sub-Categories')
            : subCatReadable(filterSubCategory);
          const filterInfo = `Category: ${catLabel} | Sub-Category: ${subCatLabel}`;
          exportToCSV(
            mappedData,
            `KWSC_Export_${filterCategory}${rangeName}_${getLocalDateString()}`,
            dateRangeLabel,
            filterInfo
          );
        } else {
          handlePrintFullReport(mappedData);
        }
        toast.success(`Exported ${mappedData.length} records successfully`);
      } else {
        toast.error("No records found matching current filters to export");
      }
    } catch (err: any) {
      console.error("Export error:", err);
      toast.error(`Failed to export data: ${err.message || "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Specific record ki history fetch karo (timeline / journey view ke liye)
  const fetchRecordHistory = async (receiving_number: string) => {
    try {
      const { data, error } = await supabase
        .from('file_tracking_records' as any)
        .select('receiving_number, history')
        .eq('receiving_number', receiving_number)
        .single();

      if (!error && data) {
        setRecords(prev =>
          prev.map(r =>
            r.receiving_number === receiving_number
              ? { ...r, history: (data as any).history || [] }
              : r
          )
        );
      }
    } catch (err) {
      console.error('History fetch error:', err);
    }
  };

  useEffect(() => {
    fetchRecords(currentPage);
  }, [currentPage, filterCategory, filterSubCategory, filterSection, filterStatus, sortOrder, searchQuery, activeTab, viewingRole, reportDateFilter, customFilterStartDate, customFilterEndDate]);


  useEffect(() => {
    // If navigated from BillDispatch with a bill in state
    if (location.state?.bill) {
      setSelectedBill(location.state.bill);
      setCoveringSlipPrintDate(getLocalDateString(location.state.bill.created_at));
      setCoveringSlipCreatedDate(getLocalDateString(location.state.bill.created_at));
      setSearchQuery(location.state.bill.tracking_id || location.state.bill.diary_no);
    }
  }, [location.state]);

  const handleSearch = async () => {
    if (!searchQuery) {
      setSelectedBill(null);
      return;
    }

    setIsLoading(true);
    try {
      // 1. Check current records first
      const localMatch = records.find(r =>
        r.tracking_id?.toLowerCase() === searchQuery.toLowerCase() ||
        r.cfo_diary_number?.toLowerCase() === searchQuery.toLowerCase() ||
        r.receiving_number?.toLowerCase() === searchQuery.toLowerCase() ||
        r.subject?.toLowerCase().includes(searchQuery.toLowerCase())
      );

      if (localMatch) {
        setSelectedBill({
          ...localMatch,
          diary_no: localMatch.cfo_diary_number || localMatch.diary_no,
          party_name: localMatch.received_from || localMatch.party_name,
          amount: localMatch.amount || 0,
          history: localMatch.history || []
        });
        setCoveringSlipPrintDate(getLocalDateString(localMatch.created_at));
        setCoveringSlipCreatedDate(getLocalDateString(localMatch.created_at));
        toast.success("Found record matching your input");
        return;
      }

      // 2. Fetch from DB if not in current page
      const { data, error } = await supabase
        .from('file_tracking_records' as any)
        .select('*')
        .or(`cfo_diary_number.eq.${searchQuery},receiving_number.eq.${searchQuery},tracking_id.eq.${searchQuery},subject.ilike.%${searchQuery}%`)
        .maybeSingle();

      if (!error && data) {
        setSelectedBill({
          ...(data as any),
          diary_no: (data as any).cfo_diary_number,
          party_name: (data as any).received_from,
          amount: (data as any).amount || 0,
          history: (data as any).history || []
        });
        setCoveringSlipPrintDate(getLocalDateString((data as any).created_at));
        setCoveringSlipCreatedDate(getLocalDateString((data as any).created_at));
        toast.success("Found record in database");
      } else {
        setSelectedBill(null);
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Error searching record");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    setIsPrintingCovering(true);
    setTimeout(() => {
      window.print();
      setIsPrintingCovering(false);
    }, 250);
  };

  // Dynamic sections from Supabase app_config (replaces hardcoded array)
  const sections = sectionsToLegacy(dynSections).length > 0
    ? sectionsToLegacy(dynSections)
    : [
        { id: 'cfo', name: 'CFO' },
        { id: 'cia', name: 'CIA' },
        { id: 'budget', name: 'BUDGET' },
        { id: 'pension', name: 'PENSION' },
        { id: 'fund', name: 'FUND' },
        { id: 'internal_audit_1', name: 'INTERNAL AUDIT-1' },
        { id: 'director_account', name: 'DIRECTOR ACCOUNT' },
        { id: 'director_finance', name: 'DIRECTOR FINANCE' },
        { id: 'director_it', name: 'DIRECTOR IT' },
        { id: 'sub_cfo', name: 'ASST. CFO' },
        { id: 'books', name: 'BOOKS' },
        { id: 'establishment', name: 'ESTABLISHMENT' },
        { id: 'director_audit', name: 'DIRECTOR AUDIT' },
        { id: 'internal_audit_2', name: 'INTERNAL AUDIT-2' },
        { id: 'law_department', name: 'LAW DEPARTMENT' },
        { id: 'chro', name: 'CHRO' },
        { id: 'md_office', name: 'MD OFFICE' }
      ];

  // Logic to filter viewable files based on the viewing role
  // If CFO/Admin views another department, they see exactly what that department would see
  // SUB_CFO acts as a restricted section user but for the 'cfo' section
  const effectiveViewingRole = viewingRole === 'sub_cfo' ? 'cfo' : viewingRole;

  // Inbox count for badge
  const [inboxCount, setInboxCount] = useState(0);
  const [trayRecords, setTrayRecords] = useState<any[]>([]);

  useEffect(() => {
    const fetchTraySummary = async () => {
      const { data, count, error } = await supabase
        .from('file_tracking_records' as any)
        .select('id, tracking_id, subject, receiving_number, received_from, main_category, sub_category, mark_to, created_at', { count: 'exact' })
        .eq('mark_to', effectiveViewingRole)
        .order('created_at', { ascending: false })
        .limit(50);

      if (!error && data) {
        setTrayRecords(data);
        setInboxCount(count || 0);
      }
    };
    fetchTraySummary();
  }, [effectiveViewingRole]);

  const handleProcessFile = (file: any) => {
    // Prepare form for the selected department to contribute their part
    setActiveTab("register"); // Switch to registration tab
    // History on-demand fetch for forwarding
    fetchRecordHistory(file.receiving_number);
    setFormData({
      ...formData,
      cfo_diary_number: file.cfo_diary_number,
      received_from: sections.find(s => s.id === currentRole)?.name || file.received_from,
      receiving_number: file.receiving_number,
      mainCategory: file.mainCategory,
      subCategory: file.subCategory,
      subject: file.subject,
      amount: file.amount || 0,
      remarks: ``, // Clear remarks for new entry
      mark_to: "cfo", // Defaulting back to CFO
      signature_data: "" // Clear signature for new person to sign
    });
    setIsForwardingMode(true);
    toast.info(`Now processing: ${file.subject}. Review the journey below before signing.`);
  };

  const handleExitFile = async (file: any) => {
    setIsExitingFile(true);
    try {
      // Create an "EXITED" history entry
      const snapshot = {
        date: new Date().toISOString(),
        processed_by: sections.find(s => s.id === currentRole)?.name || currentRole,
        action: "EXITED",
        amount: file.amount || 0,
        remarks: "Manually exited by CFO/Admin"
      };
      
      const newHistory = [...(file.history || []), snapshot];

      const { error } = await supabase
        .from('file_tracking_records' as any)
        .update({
          mark_to: 'exited',
          history: newHistory
        })
        .eq('id', file.id);

      if (error) throw error;

      logActivity({
        userRole: currentRole || 'unknown',
        userName: userName || sections.find(s => s.id === currentRole)?.name || currentRole || 'Unknown',
        action: 'EXIT',
        recordId: file.id,
        diaryNumber: file.cfo_diary_number,
        receivingNumber: file.receiving_number,
        subject: file.subject,
        details: { status: 'exited' }
      });

      toast.success("File successfully exited!");
      fetchRecords(currentPage);
    } catch (err: any) {
      console.error(err);
      toast.error(`Error exiting file: ${err.message || "Unknown error"}`);
    } finally {
      setIsExitingFile(false);
    }
  };

  const handleScanExit = async (val: string) => {
    if (!val.trim()) return;
    setIsScanning(true);
    try {
      const { data, error } = await supabase
        .from('file_tracking_records' as any)
        .select('*')
        .or(`receiving_number.eq.${val.trim()},cfo_diary_number.eq.${val.trim()}`)
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      
      if (!data) {
        toast.error("File not found! Please check the scanned code.");
        return;
      }
      
      if (data.mark_to === 'exited') {
        toast.info("This file is already marked as EXITED.");
        setScanInput("");
        return;
      }

      await handleExitFile(data);
      setScanInput("");
    } catch (err: any) {
      toast.error(err.message || "Failed to scan and exit file.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleQRClick = (diary: string, receiving: string, print_date?: string, created_date?: string) => {
    setQrFullScreen({ diary, receiving, print_date, created_date });
  };

  const totalPages = Math.ceil(totalRecords / DB_PAGE_SIZE) || 1;

  const toggleSelectRecord = (id: string) => {
    setSelectedRecordIds(prev =>
      prev.includes(id) ? prev.filter(rid => rid !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = (ids: string[]) => {
    if (selectedRecordIds.length === ids.length) {
      setSelectedRecordIds([]);
    } else {
      setSelectedRecordIds(ids);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-[#0f1115]/80 p-6 rounded-[32px] border border-white/5 backdrop-blur-xl shadow-2xl">
        <div className="space-y-1">
          <h1 className="text-2xl font-black flex items-center gap-3 text-white tracking-tighter">
            <div className="w-10 h-10 rounded-xl bg-[#14b8a6]/10 flex items-center justify-center border border-[#14b8a6]/20">
              <FileSearch className="w-6 h-6 text-[#14b8a6]" />
            </div>
            Centralized Tracking & Workflow
            {isInitialLoading && (
              <Badge variant="outline" className="ml-2 bg-[#14b8a6]/10 text-[#14b8a6] border-[#14b8a6]/20 animate-pulse text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                Syncing
              </Badge>
            )}
          </h1>
          <p className="text-xs text-white/40 italic font-medium ml-14">Real-time file movement across KW&SB Finance Sections</p>
        </div>

        <div className="flex items-center gap-4">
          {/* Enhanced Role Selector Box */}
          <div className="flex items-center gap-4 bg-[#111318] border border-white/5 rounded-2xl px-5 py-3 shadow-inner">
            <div className="w-10 h-10 rounded-full bg-[#14b8a6]/10 flex items-center justify-center border border-[#14b8a6]/20">
              <Users className="w-5 h-5 text-[#14b8a6]" />
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase text-white/30 tracking-[0.15em] mb-0.5">
                {currentRole === 'cfo' ? 'Viewing Dept' : 'Logged In As'}
              </span>
              {currentRole === 'cfo' ? (
                <Select value={viewingRole} onValueChange={setViewingRole}>
                  <SelectTrigger className="h-6 p-0 border-none bg-transparent shadow-none focus:ring-0 text-lg font-black text-[#14b8a6] hover:text-[#14b8a6]/80 transition-all italic flex items-center gap-2">
                    <SelectValue>
                      {sections.find(s => s.id === viewingRole)?.name || 'CFO'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-[#0f1115] border-white/10 text-white/70 z-[100] rounded-xl shadow-2xl">
                    {sections.map((s) => (
                      <SelectItem key={s.id} value={s.id} className="text-xs font-bold uppercase tracking-tight py-2.5">
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-lg font-black text-[#14b8a6] italic">{userName || sections.find(s => s.id === currentRole)?.name}</p>
              )}
            </div>
          </div>

          {/* Notification & Signout */}
          <div className="flex items-center gap-3">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon" className="w-12 h-12 rounded-xl bg-[#111318] border-white/5 text-white/70 hover:text-[#14b8a6] hover:bg-[#14b8a6]/5 transition-all relative">
                  <Bell className="w-5 h-5" />
                  {inboxCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#ef4444] text-white rounded-full text-[10px] font-black flex items-center justify-center border-2 border-[#0f1115] shadow-lg">
                      {inboxCount}
                    </span>
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#0f1115] border-white/10 text-white">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-white">
                    <ArrowDownCircle className="w-5 h-5 text-[#14b8a6]" />
                    Incoming Files Tray
                  </DialogTitle>
                  <DialogDescription className="text-white/40 uppercase text-[10px] font-bold tracking-widest">FILES PENDING YOUR REVIEW AND SIGNATURE</DialogDescription>
                </DialogHeader>
                <ScrollArea className="h-[300px] mt-4 pr-4">
                  {trayRecords.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-white/20">
                      <Inbox className="w-12 h-12 opacity-20 mb-2" />
                      <p className="text-xs font-bold">No new files for your section</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {trayRecords.map((file, i) => (
                        <div key={i} className="p-4 rounded-xl border border-white/5 bg-white/5 hover:bg-[#14b8a6]/10 cursor-pointer transition-all group" onClick={() => handleProcessFile(file)}>
                          <div className="flex justify-between items-start">
                            <h4 className="font-bold text-sm text-white group-hover:text-[#14b8a6]">{file.subject}</h4>
                            <Badge className="bg-[#14b8a6]/20 text-[#14b8a6] border-none text-[10px]">{file.receiving_number}</Badge>
                          </div>
                          <p className="text-[10px] text-white/40 mt-1 uppercase font-bold">From: {file.received_from}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </DialogContent>
            </Dialog>

            <Button
              variant="outline"
              className="h-12 px-6 rounded-xl bg-[#111318] border-white/5 text-white/70 hover:text-red-400 hover:bg-red-400/5 transition-all font-black text-xs gap-2"
              onClick={async () => {
                await signOut();
                navigate('/login');
              }}
            >
              <ArrowUpCircle className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col xl:flex-row justify-between xl:items-center gap-4 mb-6 border-b border-border/50 pb-4">
          <TabsList className="flex h-auto bg-[#0f1115] p-1.5 rounded-2xl border border-white/5 shrink-0 gap-1 overflow-x-auto overflow-y-hidden no-scrollbar max-w-full shadow-2xl">
            {isFileViewer ? (
              <TabsTrigger
                value="view_only"
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl data-[state=active]:bg-[#14b8a6] data-[state=active]:text-[#0f1115] text-white/50 hover:text-white transition-all font-black text-sm"
              >
                <FileSearch className="w-4 h-4" /> View Only
              </TabsTrigger>
            ) : (
              <>
                <TabsTrigger
                  value="register"
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl data-[state=active]:bg-[#14b8a6] data-[state=active]:text-[#0f1115] text-white/50 hover:text-white transition-all font-black text-sm"
                >
                  <Plus className="w-4 h-4" /> Registration
                </TabsTrigger>

                <TabsTrigger
                  value="tray"
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl data-[state=active]:bg-[#14b8a6] data-[state=active]:text-[#0f1115] text-white/50 hover:text-white transition-all font-black text-sm relative"
                >
                  <Inbox className="w-4 h-4" /> My Tray
                  {inboxCount > 0 && (
                    <span className="absolute -top-1.5 -right-1 bg-[#ef4444] text-white text-[9px] font-black min-w-[18px] h-[18px] rounded-full flex items-center justify-center border-2 border-[#0f1115] shadow-lg">
                      {inboxCount}
                    </span>
                  )}
                </TabsTrigger>

                <TabsTrigger
                  value="timeline"
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl data-[state=active]:bg-[#14b8a6] data-[state=active]:text-[#0f1115] text-white/50 hover:text-white transition-all font-black text-sm"
                >
                  <History className="w-4 h-4" /> Timeline
                </TabsTrigger>

                <TabsTrigger
                  value="reports"
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl data-[state=active]:bg-[#14b8a6] data-[state=active]:text-[#0f1115] text-white/50 hover:text-white transition-all font-black text-sm"
                >
                  <FileSearch className="w-4 h-4" /> Tracking Reports
                </TabsTrigger>

                <TabsTrigger
                  value="track"
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl data-[state=active]:bg-[#14b8a6] data-[state=active]:text-[#0f1115] text-white/50 hover:text-white transition-all font-black text-sm"
                >
                  <Search className="w-4 h-4" /> Search
                </TabsTrigger>

                {isCFORole && (
                  <TabsTrigger
                    value="cfo_all_files"
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl data-[state=active]:bg-[#14b8a6] data-[state=active]:text-[#0f1115] text-white/50 hover:text-white transition-all font-black text-sm"
                  >
                    <Building2 className="w-4 h-4" /> CFO Dashboard
                  </TabsTrigger>
                )}
              </>
            )}
          </TabsList>

          <div className="flex flex-wrap items-center gap-2">
            {/* Global Search for My Tray, Timeline, Reports */}
            {activeTab !== 'track' && activeTab !== 'register' && (
              <div className="relative shrink-0">
                <Input
                  placeholder="Quick Search..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-[180px] h-9 text-xs bg-muted/20 border-border/50 pl-8 focus-visible:ring-primary/50"
                />
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              </div>
            )}

            <Select value={filterCategory} onValueChange={(v) => {
              setFilterCategory(v);
              setFilterSubCategory("all"); // Reset subcategory when category changes
            }}>
              <SelectTrigger className="w-[140px] h-10 text-xs bg-[#0f1115] border-white/5 text-white/70 hover:text-white transition-all rounded-xl shrink-0">
                <SelectValue placeholder="Category View" />
              </SelectTrigger>
              <SelectContent className="bg-[#0f1115] border-white/10 text-white/70">
                <SelectItem value="all">All Categories</SelectItem>
                {dynMainCats.map(mc => (
                  <SelectItem key={mc.config_key} value={mc.config_key}>{mc.config_label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterSubCategory} onValueChange={setFilterSubCategory}>
              <SelectTrigger className="w-[155px] h-10 text-xs bg-[#0f1115] border-white/5 text-white/70 hover:text-white transition-all rounded-xl shrink-0">
                <SelectValue placeholder="Sub Category">
                  {filterSubCategory === 'all'
                    ? (filterCategory !== 'all'
                        ? `All ${filterCategory === 'pol_bills' ? 'POL Bills' : filterCategory.charAt(0).toUpperCase() + filterCategory.slice(1)} Sub-Cats`
                        : 'All Sub-Categories')
                    : subCatReadable(filterSubCategory)
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-[#0f1115] border-white/10 text-white/70">
                <SelectItem value="all">
                  {filterCategory !== 'all'
                    ? `All ${filterCategory === 'pol_bills' ? 'POL Bills' : filterCategory.charAt(0).toUpperCase() + filterCategory.slice(1)} Sub-Categories`
                    : 'All Sub-Categories'
                  }
                </SelectItem>
                {(filterCategory === 'all'
                  ? dynSubCats
                  : dynSubCats.filter(sc => sc.parent_key === filterCategory)
                ).map(sc => (
                  <SelectItem key={sc.config_key} value={sc.config_key}>{sc.config_label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterSection} onValueChange={setFilterSection}>
              <SelectTrigger className="w-[140px] h-10 text-xs bg-[#0f1115] border-white/5 text-white/70 hover:text-white transition-all rounded-xl shrink-0">
                <SelectValue placeholder="Section View" />
              </SelectTrigger>
              <SelectContent className="bg-[#0f1115] border-white/10 text-white/70">
                <SelectItem value="all">All Sections</SelectItem>
                {sections.map((s) => (
                  <SelectItem key={s.id} value={s.id} className="text-xs font-bold uppercase tracking-tight py-2.5">
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <Select value={reportDateFilter} onValueChange={setReportDateFilter}>
                <SelectTrigger className="w-[150px] h-10 text-xs bg-[#0f1115] border-white/5 text-white/70 hover:text-white transition-all rounded-xl shrink-0">
                  <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent className="bg-[#0f1115] border-white/10 text-white/70">
                  <SelectItem value="all">All Time Records</SelectItem>
                  <SelectItem value="today">Daily Report (Today)</SelectItem>
                  <SelectItem value="weekly">Weekly Summary</SelectItem>
                  <SelectItem value="monthly">Monthly Audit</SelectItem>
                  <SelectItem value="yearly">Yearly Overview</SelectItem>
                  <SelectItem value="custom">Specific Date</SelectItem>
                </SelectContent>
              </Select>

              {reportDateFilter === 'custom' && (
                <div className="flex items-center gap-2 animate-in slide-in-from-left-2 duration-300">
                  <span className="text-[10px] uppercase font-black text-white/40 tracking-wider">From</span>
                  <Input
                    type="date"
                    value={customFilterStartDate}
                    onChange={(e) => setCustomFilterStartDate(e.target.value)}
                    className="h-10 w-[130px] bg-[#0f1115] border-white/5 text-xs text-white/70 rounded-xl focus:border-[#14b8a6]/50 focus:ring-[#14b8a6]/20"
                  />
                  <span className="text-[10px] uppercase font-black text-white/40 tracking-wider">To</span>
                  <Input
                    type="date"
                    value={customFilterEndDate}
                    onChange={(e) => setCustomFilterEndDate(e.target.value)}
                    className="h-10 w-[130px] bg-[#0f1115] border-white/5 text-xs text-white/70 rounded-xl focus:border-[#14b8a6]/50 focus:ring-[#14b8a6]/20"
                  />
                </div>
              )}
            </div>

            <Select value={sortOrder} onValueChange={(v: "desc" | "asc") => setSortOrder(v)}>
              <SelectTrigger className="w-[130px] h-10 text-xs bg-[#0f1115] border-white/5 text-white/70 hover:text-white transition-all rounded-xl shrink-0">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent className="bg-[#0f1115] border-white/10 text-white/70">
                <SelectItem value="desc">Newest First</SelectItem>
                <SelectItem value="asc">Oldest First</SelectItem>
              </SelectContent>
            </Select>

            {activeTab !== 'register' && !isFileViewer && (
              <div className="flex items-center gap-1.5 ml-2">
                <Button
                  onClick={() => handleBulkExport('pdf')}
                  disabled={isLoading}
                  variant="outline"
                  className="h-10 px-4 bg-[#14b8a6]/10 border-[#14b8a6]/20 text-[#14b8a6] hover:bg-[#14b8a6] hover:text-[#0f1115] transition-all rounded-xl font-black text-[10px] uppercase gap-2 shrink-0 shadow-lg shadow-[#14b8a6]/5"
                >
                  {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Printer className="w-4 h-4" />}
                  Bulk PDF
                </Button>
                <Button
                  onClick={() => handleBulkExport('csv')}
                  disabled={isLoading}
                  variant="outline"
                  className="h-10 px-4 bg-emerald-500/10 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all rounded-xl font-black text-[10px] uppercase gap-2 shrink-0 shadow-lg shadow-emerald-500/5"
                >
                  {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-4 h-4 rotate-180" />}
                  Bulk CSV
                </Button>
              </div>
            )}

            {selectedRecordIds.length > 0 && (
              <div className="flex items-center gap-1 ml-2 animate-in fade-in slide-in-from-right-4">
                <Badge variant="secondary" className="h-9 px-3 rounded-md bg-primary/10 text-primary border-primary/20 flex items-center gap-2">
                  <span className="font-bold">{selectedRecordIds.length} Selected</span>
                  <div className="flex gap-1 border-l border-primary/20 pl-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 hover:bg-primary/20 text-primary"
                      title="Export Selected to PDF"
                      onClick={() => handlePrintFullReport(records.filter(r => selectedRecordIds.includes(r.id)))}
                    >
                      <FileText className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 hover:bg-primary/20 text-primary"
                      title="Export Selected to CSV"
                      onClick={() => exportToCSV(records.filter(r => selectedRecordIds.includes(r.id)), "Selected_Files")}
                    >
                      <Plus className="w-3.5 h-3.5 rotate-45" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 hover:bg-red-500/20 text-red-500"
                      title="Clear Selection"
                      onClick={() => setSelectedRecordIds([])}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </Badge>
              </div>
            )}
          </div>
        </div>

        <TabsContent value="tray" className="animate-fade-in">
          <Card className="glass-card border-none shadow-xl">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <Inbox className="w-6 h-6 text-primary" />
                  {sections.find(s => s.id === currentRole)?.name} - Departmental Tray
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Files assigned to your section for processing</p>
              </div>
              {/* Tray inline search */}
              <div className="relative w-full sm:w-[280px] shrink-0">
                <Input
                  placeholder="Search by subject, diary no, from..."
                  value={traySearchQuery}
                  onChange={e => setTraySearchQuery(e.target.value)}
                  className="h-10 pl-9 pr-4 text-xs bg-muted/20 border-border/50 rounded-xl focus-visible:ring-primary/50"
                />
                <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                {traySearchQuery && (
                  <button
                    onClick={() => setTraySearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors text-xs font-bold"
                  >✕</button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isInitialLoading || isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                  <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                  <h3 className="text-sm font-bold uppercase tracking-widest">Loading Records...</h3>
                </div>
              ) : records.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground bg-muted/5 rounded-xl border-2 border-dashed border-border/50">
                  <Inbox className="w-16 h-16 opacity-10 mb-4" />
                  <h3 className="text-lg font-bold">Your Tray is Empty</h3>
                  <p className="text-sm">No files found for your section matching current filters.</p>
                </div>
              ) : records.filter(f => {
                if (!traySearchQuery.trim()) return true;
                const q = traySearchQuery.toLowerCase();
                return (
                  (f.subject || "").toLowerCase().includes(q) ||
                  (f.cfo_diary_number || "").toLowerCase().includes(q) ||
                  (f.receiving_number || "").toLowerCase().includes(q) ||
                  (f.received_from || "").toLowerCase().includes(q) ||
                  (f.mainCategory || f.main_category || "").toLowerCase().includes(q)
                );
              }).length === 0 && traySearchQuery ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground bg-muted/5 rounded-xl border-2 border-dashed border-border/50">
                  <Search className="w-16 h-16 opacity-10 mb-4" />
                  <h3 className="text-lg font-bold">No Results Found</h3>
                  <p className="text-sm">No files match "<strong>{traySearchQuery}</strong>"</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-md border border-border/50 overflow-hidden">
                    <Table>
                      <TableHeader className="bg-muted/50">
                        <TableRow>
                          <TableHead className="w-[40px]">
                            <Checkbox
                              checked={records.length > 0 && records.every(f => selectedRecordIds.includes(f.id))}
                              onCheckedChange={() => toggleSelectAll(records.map(f => f.id))}
                            />
                          </TableHead>
                          <TableHead className="text-xs uppercase font-bold">Diary/Ref No</TableHead>
                          <TableHead className="text-xs uppercase font-bold text-center">Track QR</TableHead>
                          <TableHead className="text-xs uppercase font-bold">Subject</TableHead>
                          <TableHead className="text-xs uppercase font-bold">Category</TableHead>
                          <TableHead className="text-xs uppercase font-bold">Amount</TableHead>
                          <TableHead className="text-xs uppercase font-bold">From</TableHead>
                          <TableHead className="text-xs uppercase font-bold">Date Marked</TableHead>
                          <TableHead className="text-xs uppercase font-bold text-center">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {records.filter(f => {
                            if (!traySearchQuery.trim()) return true;
                            const q = traySearchQuery.toLowerCase();
                            return (
                              (f.subject || "").toLowerCase().includes(q) ||
                              (f.cfo_diary_number || "").toLowerCase().includes(q) ||
                              (f.receiving_number || "").toLowerCase().includes(q) ||
                              (f.received_from || "").toLowerCase().includes(q) ||
                              (f.mainCategory || f.main_category || "").toLowerCase().includes(q)
                            );
                          }).map((file, i) => (
                          <TableRow key={i} className="hover:bg-primary/5 transition-colors group">
                            <TableCell>
                              <Checkbox
                                checked={selectedRecordIds.includes(file.id)}
                                onCheckedChange={() => toggleSelectRecord(file.id)}
                              />
                            </TableCell>
                            <TableCell className="font-mono text-xs font-bold text-primary">{file.receiving_number}</TableCell>
                            <TableCell className="text-center">
                              {file.cfo_diary_number && (
                                <div
                                  className="cursor-zoom-in group/qr transition-transform hover:scale-110"
                                  onClick={() => handleQRClick(file.cfo_diary_number, file.receiving_number, getLocalDateString(file.created_at), getLocalDateString(file.created_at))}
                                >
                                  <img
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=35x35&data=${encodeURIComponent(`${window.location.origin}/public-track/${file.cfo_diary_number}/${file.receiving_number}`)}&color=0ea5e9`}
                                    alt="QR"
                                    className="w-8 h-8 mx-auto opacity-70 group-hover:opacity-100 transition-opacity rounded border border-border bg-white"
                                  />
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="font-semibold text-sm">{file.subject}</TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                <Badge variant="outline" className="text-[10px] uppercase">{mainCatReadable(file.mainCategory)}</Badge>
                                {file.subCategory && (
                                  <span className="text-[9px] text-muted-foreground uppercase font-bold px-1 italic">
                                    {file.subCategory.replace(/_/g, " ")}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="font-bold text-xs text-primary">{formatCurrency(file.amount || 0)}</TableCell>
                            <TableCell className="text-xs">{file.received_from}</TableCell>
                            <TableCell className="text-xs">{new Date(file.created_at).toLocaleDateString()}</TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 gap-2 border-primary/20 hover:bg-primary hover:text-white transition-all"
                                  onClick={() => handleProcessFile(file)}
                                >
                                  Review & Sign <ArrowRight className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 w-8 p-0 border-blue-500/20 text-blue-500 hover:bg-blue-500 hover:text-white transition-all ml-1"
                                  title="Edit Record"
                                  onClick={() => {
                                    setRecordToEdit(file);
                                    setIsEditModalOpen(true);
                                  }}
                                >
                                  <FileEdit className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 w-8 p-0 border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                                  title="Delete Record"
                                  onClick={() => {
                                    setRecordToDelete(file.id);
                                    setIsDeleteModalOpen(true);
                                  }}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Server Pagination */}
                  {totalRecords > DB_PAGE_SIZE && (
                    <div className="flex items-center justify-between pt-4 border-t border-border/50">
                      <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                        Showing {records.length} of {totalRecords} records
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                          disabled={currentPage === 0 || isLoading}
                          className="h-8 text-[10px] font-black uppercase tracking-tight"
                        >
                          <ArrowLeft className="w-3 h-3 mr-1" /> Previous
                        </Button>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            const pageNum = i;
                            return (
                              <Button
                                key={pageNum}
                                variant={currentPage === pageNum ? "default" : "outline"}
                                size="sm"
                                onClick={() => setCurrentPage(pageNum)}
                                className={`h-8 w-8 text-[10px] font-black ${currentPage === pageNum ? 'bg-primary text-white' : ''}`}
                              >
                                {pageNum + 1}
                              </Button>
                            );
                          })}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                          disabled={currentPage >= totalPages - 1 || isLoading}
                          className="h-8 text-[10px] font-black uppercase tracking-tight"
                        >
                          Next <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="animate-fade-in">
          <Card className="glass-card border-none shadow-xl">
            <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <FileText className="w-6 h-6 text-primary" />
                  File Tracking Insights & Reports
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Exportable summaries for audits and status monitoring</p>
              </div>
              <div className="flex items-center gap-2">
                <Select value={reportDateFilter} onValueChange={setReportDateFilter}>
                  <SelectTrigger className="w-[150px] h-9 bg-[#0f1115] border-white/5 text-xs text-white/70 hover:text-white rounded-xl">
                    <SelectValue placeholder="Date Range" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0f1115] border-white/10 text-white/70">
                    <SelectItem value="all">All Time Records</SelectItem>
                    <SelectItem value="today">Daily Report (Today)</SelectItem>
                    <SelectItem value="weekly">Weekly Summary</SelectItem>
                    <SelectItem value="monthly">Monthly Audit</SelectItem>
                    <SelectItem value="yearly">Yearly Overview</SelectItem>
                    <SelectItem value="custom">Specific Date</SelectItem>
                  </SelectContent>
                </Select>

                {reportDateFilter === 'custom' && (
                  <div className="flex items-center gap-2 animate-in slide-in-from-left-2 duration-300">
                    <span className="text-[10px] uppercase font-black text-white/40 tracking-wider">From</span>
                    <Input
                      type="date"
                      value={customFilterStartDate}
                      onChange={(e) => setCustomFilterStartDate(e.target.value)}
                      className="h-9 w-[120px] bg-[#0f1115] border-white/5 text-xs text-white/70 rounded-xl focus:border-[#14b8a6]/50 focus:ring-[#14b8a6]/20"
                    />
                    <span className="text-[10px] uppercase font-black text-white/40 tracking-wider">To</span>
                    <Input
                      type="date"
                      value={customFilterEndDate}
                      onChange={(e) => setCustomFilterEndDate(e.target.value)}
                      className="h-9 w-[120px] bg-[#0f1115] border-white/5 text-xs text-white/70 rounded-xl focus:border-[#14b8a6]/50 focus:ring-[#14b8a6]/20"
                    />
                  </div>
                )}
                <Button
                  onClick={() => handleBulkExport('pdf')}
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs gap-2"
                >
                  <Printer className="w-4 h-4" /> Bulk PDF Export
                </Button>
                <Button
                  onClick={() => handleBulkExport('csv')}
                  disabled={isLoading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-2"
                >
                  <Upload className="w-4 h-4 rotate-180" /> Bulk CSV Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border border-border/50 overflow-hidden bg-background/40">
                <Table>
                  <TableHeader className="bg-muted/50 text-[10px] uppercase font-black tracking-tighter">
                    <TableRow>
                      <TableHead className="w-[40px]">
                        <Checkbox
                          checked={records.length > 0 && records.every(f => selectedRecordIds.includes(f.id))}
                          onCheckedChange={() => toggleSelectAll(records.map(f => f.id))}
                        />
                      </TableHead>
                      <TableHead>Diary #</TableHead>
                      <TableHead>Ref/Sub</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>From & Mark To</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead className="text-right pr-6">Export</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map((file, i) => (
                      <TableRow key={i} className="hover:bg-primary/5 border-border/30 transition-colors">
                        <TableCell>
                          <Checkbox
                            checked={selectedRecordIds.includes(file.id)}
                            onCheckedChange={() => toggleSelectRecord(file.id)}
                          />
                        </TableCell>
                        <TableCell className="font-mono text-[10px] font-bold text-primary">{file.cfo_diary_number}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-bold text-xs">{file.subject}</span>
                            <span className="text-[10px] text-muted-foreground italic">{file.receiving_number}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Badge variant="outline" className="text-[9px] uppercase border-primary/20">{mainCatReadable(file.mainCategory)}</Badge>
                            {file.subCategory && (
                              <span className="text-[8px] text-muted-foreground uppercase font-bold italic">
                                {file.subCategory.replace(/_/g, " ")}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-[10px]">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-muted-foreground">F: {file.received_from}</span>
                            <span className="text-emerald-500 font-bold">M: {sections.find(s => s.id === file.mark_to)?.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-[10px] font-mono text-muted-foreground">
                          {new Date(file.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="font-bold text-[10px] text-primary">
                          {formatCurrency(file.amount || 0)}
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:text-emerald-500"
                              onClick={() => exportToCSV([file], `Report_${file.receiving_number}`)}
                            >
                              <Upload className="w-3.5 h-3.5 rotate-180" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:text-red-400"
                              onClick={() => handlePrintFullReport([file])}
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:text-blue-500"
                              onClick={() => handleQRClick(file.cfo_diary_number, file.receiving_number, getLocalDateString(file.created_at), getLocalDateString(file.created_at))}
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:text-blue-500 hover:bg-blue-500/10"
                              title="Edit Record"
                              onClick={() => {
                                setRecordToEdit(file);
                                setIsEditModalOpen(true);
                              }}
                            >
                              <FileEdit className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:text-red-500 hover:bg-red-500/10"
                              title="Delete Record"
                              onClick={() => {
                                setRecordToDelete(file.id);
                                setIsDeleteModalOpen(true);
                              }}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Server Pagination - Reports */}
              {totalRecords > DB_PAGE_SIZE && (
                <div className="flex items-center justify-between pt-4 border-t border-border/50">
                  <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                    Showing {records.length} of {totalRecords} records
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                      disabled={currentPage === 0 || isLoading}
                      className="h-8 text-[10px] font-black uppercase tracking-tight"
                    >
                      <ArrowLeft className="w-3 h-3 mr-1" /> Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                      disabled={currentPage >= totalPages - 1 || isLoading}
                      className="h-8 text-[10px] font-black uppercase tracking-tight"
                    >
                      Next <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="animate-fade-in">
          <Card className="glass-card border-none shadow-xl">
            <CardHeader>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <History className="w-6 h-6 text-primary" />
                Department Activity Timeline
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Detailed trail of all files processed or forwarded by your section</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {isInitialLoading || isLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                    <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                    <h3 className="text-sm font-bold uppercase tracking-widest">Loading Timeline...</h3>
                  </div>
                ) : records.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-muted-foreground bg-muted/5 rounded-xl border-2 border-dashed border-border/50">
                    <History className="w-16 h-16 opacity-10 mb-4" />
                    <h3 className="text-lg font-bold">No Timeline Data</h3>
                    <p className="text-sm">You haven't interacted with any files yet.</p>
                  </div>
                ) : (
                  records.map((file, i) => (
                    <Dialog key={i}>
                      <DialogTrigger asChild>
                        <div
                          className="bg-muted/10 border border-border/50 rounded-xl p-6 cursor-pointer hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/5 group relative overflow-hidden"
                          onClick={() => {
                            // History on-demand fetch agar abhi tak load nahi hui
                            if (!file.history || file.history.length === 0) {
                              fetchRecordHistory(file.receiving_number);
                            }
                          }}
                        >
                          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 gap-1 text-[10px]">
                              <FileSearch className="w-3 h-3" /> Click to Preview
                            </Badge>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-border/50 pb-4">
                            <div>
                              <h4 className="font-bold text-base text-primary group-hover:underline">{file.subject}</h4>
                              <span className="inline-block mt-2 text-[10px] uppercase font-bold text-muted-foreground tracking-widest bg-muted/30 px-2 py-0.5 rounded-full">
                                DIARY NO: {file.cfo_diary_number} | REF: {file.receiving_number}
                              </span>
                            </div>
                            <Badge variant={file.mark_to === currentRole ? 'default' : 'secondary'} className="uppercase">
                              Current Desk: {sections.find(s => s.id === file.mark_to)?.name || file.mark_to}
                            </Badge>
                          </div>

                          <div className="space-y-0 relative border-l-2 border-primary/20 ml-3">
                            {file.history?.map((step: any, idx: number) => (
                              <div key={idx} className="relative pb-6 pl-6 last:pb-0">
                                <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                                  <div className="w-2 h-2 bg-white rounded-full"></div>
                                </div>
                                <div className="bg-background rounded-lg border border-border p-3 shadow-sm group-hover:border-primary/30 transition-colors">
                                  <div className="flex flex-wrap items-center justify-between gap-4 text-sm font-bold mb-1">
                                    <span className="text-primary flex items-center gap-1"><User className="w-3 h-3" /> {step.processed_by || 'Unknown Section'}</span>
                                    <span className="text-[10px] font-mono text-muted-foreground bg-muted/30 px-2 py-0.5 rounded">
                                      {new Date(step.date).toLocaleString()}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 mt-2">
                                    <Badge variant="outline" className="text-[9px] uppercase border-primary/20 text-primary">{step.action || 'PROCESSED'}</Badge>
                                    {step.mark_to && <span className="text-xs text-muted-foreground">&rarr; Forwarded to <strong className="text-foreground">{sections.find(s => s.id === step.mark_to)?.name || step.mark_to}</strong></span>}
                                  </div>
                                  {step.remarks && (
                                    <p className="text-xs text-muted-foreground mt-2 italic bg-muted/20 p-2 rounded border border-border/30">"{step.remarks}"</p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl bg-background/95 backdrop-blur-xl border-border/50">
                        <DialogHeader>
                          <DialogTitle className="flex items-center justify-between text-xl text-primary w-full pr-6">
                            <span className="flex items-center gap-2"><FileText className="w-5 h-5" /> File Data Preview</span>
                            <button 
                              onClick={() => setIsJourneyMapOpen(true)}
                              className="bg-sky-500/10 text-sky-500 hover:bg-sky-500 hover:text-white transition-colors px-3 py-1.5 rounded-full text-[10px] flex items-center gap-1.5 shadow-sm ml-auto"
                            >
                              <Network className="w-3.5 h-3.5" /> View Visual Map
                            </button>
                          </DialogTitle>
                          <JourneyMapModal 
                            isOpen={isJourneyMapOpen} 
                            onClose={() => setIsJourneyMapOpen(false)} 
                            record={file} 
                          />
                          <DialogDescription>Overview for Ref No: {file.receiving_number}</DialogDescription>
                        </DialogHeader>
                        <div className="grid grid-cols-2 gap-3 mt-4">
                          <div className="bg-muted/10 p-3 rounded-lg border border-border/50 col-span-2">
                            <p className="text-[10px] text-muted-foreground font-bold uppercase">Subject</p>
                            <p className="text-sm font-semibold text-primary">{file.subject}</p>
                          </div>
                          <div className="bg-muted/10 p-3 rounded-lg border border-border/50">
                            <p className="text-[10px] text-muted-foreground font-bold uppercase">CFO Diary No</p>
                            <p className="text-sm font-bold">{file.cfo_diary_number || 'N/A'}</p>
                          </div>
                          <div className="bg-muted/10 p-3 rounded-lg border border-border/50">
                            <p className="text-[10px] text-muted-foreground font-bold uppercase">Received From</p>
                            <p className="text-sm font-semibold">{file.received_from}</p>
                          </div>
                          <div className="bg-muted/10 p-3 rounded-lg border border-border/50">
                            <p className="text-[10px] text-muted-foreground font-bold uppercase">Category Structure</p>
                            <p className="text-sm font-semibold uppercase">{file.mainCategory} &rarr; {file.subCategory?.replace(/_/g, " ")}</p>
                          </div>
                          <div className="bg-muted/10 p-3 rounded-lg border border-border/50">
                            <p className="text-[10px] text-muted-foreground font-bold uppercase">Registration Date</p>
                            <p className="text-sm font-semibold">{safeFormatDate(file.created_at)}</p>
                          </div>
                          <div className="bg-muted/10 p-3 rounded-lg border border-border/50">
                            <p className="text-[10px] text-muted-foreground font-bold uppercase">Current Mark To</p>
                            <p className="text-sm font-semibold uppercase">{sections.find(s => s.id === file.mark_to)?.name || file.mark_to}</p>
                          </div>
                          <div className="bg-muted/10 p-3 rounded-lg border border-border/50">
                            <p className="text-[10px] text-muted-foreground font-bold uppercase">Outward Date</p>
                            <p className="text-sm font-semibold text-emerald-500">{file.outward_date ? new Date(file.outward_date).toLocaleDateString() : 'N/A'}</p>
                          </div>
                          <div className="bg-muted/10 p-3 rounded-lg border border-border/50">
                            <p className="text-[10px] text-muted-foreground font-bold uppercase">Net Amount</p>
                            <p className="text-sm font-bold text-primary">{formatCurrency(file.amount || 0)}</p>
                          </div>
                          {file.remarks && (
                            <div className="bg-muted/10 p-3 rounded-lg border border-border/50 col-span-2 text-amber-500">
                              <p className="text-[10px] text-muted-foreground font-bold uppercase text-amber-500/70">Latest Remarks</p>
                              <p className="text-sm font-semibold italic">"{file.remarks}"</p>
                            </div>
                          )}
                        </div>
                        <div className="mt-4 flex justify-end">
                          <Button variant="outline" className="border-primary/20 hover:bg-primary/10" onClick={() => handleQRClick(file.cfo_diary_number, file.receiving_number)}>
                            <Printer className="w-4 h-4 mr-2" /> View Printable Slip
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  ))
                )}
                {/* Server Pagination - Timeline */}
                {totalRecords > DB_PAGE_SIZE && (
                  <div className="flex items-center justify-between pt-4 border-t border-border/50">
                    <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                      Showing {records.length} of {totalRecords} records
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                        disabled={currentPage === 0 || isLoading}
                        className="h-8 text-[10px] font-black uppercase tracking-tight"
                      >
                        <ArrowLeft className="w-3 h-3 mr-1" /> Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                        disabled={currentPage >= totalPages - 1 || isLoading}
                        className="h-8 text-[10px] font-black uppercase tracking-tight"
                      >
                        Next <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="track" className="animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Search Panel */}
            <Card className="glass-card border-none shadow-xl">
              <CardHeader>
                <CardTitle className="text-sm font-bold uppercase tracking-widest text-primary">Track Your File</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold font-mono">TRACKING ID / DIARY NO</Label>
                  <div className="relative">
                    <Input
                      placeholder="e.g. FL-2024-1234"
                      value={searchQuery}
                      onChange={e => {
                        setSearchQuery(e.target.value);
                        // Trigger search automatically as user types
                        setTimeout(() => handleSearch(), 0);
                      }}
                      className="bg-muted/20 border-primary/20 h-12 font-mono text-base pr-10 focus-visible:ring-primary shadow-inner"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-primary/40">
                      {isLoading ? <Clock className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                    </div>
                  </div>
                </div>

                {selectedBill && (
                  <div className="pt-4 border-t border-border/50 space-y-4 animate-fade-in">
                    <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[10px] font-bold text-primary uppercase">Current Status</p>
                          <h3 className="text-xl font-bold flex items-center gap-2 mt-1">
                            <Building2 className="w-5 h-5 text-primary" />
                            {selectedBill.mark_to ? sections.find(s => s.id === selectedBill.mark_to)?.name : "Registered"}
                          </h3>
                          <div className="mt-2 text-[10px] font-bold uppercase px-2 py-0.5 bg-primary/10 text-primary w-fit rounded">
                            {selectedBill.current_status || "Processing"}
                          </div>
                        </div>
                        <div
                          className="bg-white p-1 rounded-lg border border-primary/20 shadow-sm cursor-zoom-in hover:scale-110 transition-transform"
                          onClick={() => handleQRClick(selectedBill.cfo_diary_number || selectedBill.diary_no, selectedBill.receiving_number || selectedBill.tracking_id, getLocalDateString(selectedBill.created_at), getLocalDateString(selectedBill.created_at))}
                        >
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=${encodeURIComponent(`${window.location.origin}/public-track/${selectedBill.cfo_diary_number || selectedBill.diary_no}/${selectedBill.receiving_number || selectedBill.tracking_id}`)}`}
                            alt="QR"
                            className="w-12 h-12"
                          />
                        </div>
                      </div>
                    </div>

                    {isAdmin && (
                      <div className="space-y-2 mt-4">
                        <Label className="text-xs uppercase font-bold text-amber-500 flex items-center gap-2">
                          <Calendar className="w-3 h-3" />
                          Created Date
                          <span className="text-[9px] font-normal text-muted-foreground normal-case">(For Covering Slip)</span>
                        </Label>
                        <Input
                          type="date"
                          value={coveringSlipCreatedDate}
                          onChange={e => setCoveringSlipCreatedDate(e.target.value)}
                          className="bg-amber-500/5 border-amber-500/30 text-amber-500 font-bold focus-visible:ring-amber-500 mb-4"
                        />
                        <Label className="text-xs uppercase font-bold text-emerald-500 flex items-center gap-2 mt-4">
                          <Printer className="w-3 h-3" />
                          Print Date
                          <span className="text-[9px] font-normal text-muted-foreground normal-case">(For Covering Slip)</span>
                        </Label>
                        <Input
                          type="date"
                          value={coveringSlipPrintDate}
                          onChange={e => setCoveringSlipPrintDate(e.target.value)}
                          className="bg-emerald-500/5 border-emerald-500/30 text-emerald-500 font-bold focus-visible:ring-emerald-500"
                        />
                      </div>
                    )}

                    <Button variant="outline" className="w-full gap-2 border-primary/20 hover:bg-primary/5 font-bold mt-2" onClick={handlePrint}>
                      <Printer className="w-4 h-4" /> Print Covering Page (Slip)
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Content Panel */}
            <div className="lg:col-span-2 space-y-6">
              {!selectedBill ? (
                <Card className="glass-card border-none shadow-xl">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-xl font-bold flex items-center gap-2">
                        <History className="w-6 h-6 text-primary" />
                        All Entries
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">Found {totalRecords} records matching your filters</p>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="rounded-md border border-border/50 overflow-hidden">
                        <Table>
                          <TableHeader className="bg-muted/50">
                            <TableRow>
                              <TableHead className="text-xs uppercase font-bold">Diary No</TableHead>
                              <TableHead className="text-xs uppercase font-bold">Track QR</TableHead>
                              <TableHead className="text-xs uppercase font-bold">Subject</TableHead>
                              <TableHead className="text-xs uppercase font-bold">Category</TableHead>
                              <TableHead className="text-xs uppercase font-bold">Amount</TableHead>
                              <TableHead className="text-xs uppercase font-bold">Marked To</TableHead>
                              <TableHead className="text-xs uppercase font-bold text-center">Action</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {records.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                  No records found matching criteria
                                </TableCell>
                              </TableRow>
                            ) : (
                              records.map((file, i) => (
                                <TableRow key={i} className="hover:bg-primary/5 transition-colors group">
                                  <TableCell className="font-mono text-xs font-bold text-primary">{file.cfo_diary_number}</TableCell>
                                  <TableCell className="text-center">
                                    <div
                                      className="cursor-zoom-in transition-transform hover:scale-110"
                                      onClick={() => handleQRClick(file.cfo_diary_number, file.receiving_number)}
                                    >
                                      <img
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=35x35&data=${encodeURIComponent(`${window.location.origin}/public-track/${file.cfo_diary_number}/${file.receiving_number}`)}&color=0ea5e9`}
                                        alt="QR"
                                        className="w-8 h-8 mx-auto rounded border border-border bg-white"
                                      />
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="font-semibold text-sm">{file.subject}</div>
                                    <div className="text-[10px] text-muted-foreground">{file.receiving_number}</div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex flex-col gap-1">
                                      <Badge variant="outline" className="text-[9px] uppercase">{mainCatReadable(file.mainCategory)}</Badge>
                                      {file.subCategory && (
                                        <span className="text-[8px] text-muted-foreground uppercase font-bold italic">
                                          {file.subCategory.replace(/_/g, " ")}
                                        </span>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell className="font-bold text-xs text-primary">{formatCurrency(file.amount || 0)}</TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className="text-[10px] uppercase">
                                      {sections.find(s => s.id === file.mark_to)?.name}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-8 gap-2 border-primary/20 hover:bg-primary hover:text-white"
                                      onClick={() => {
                                        setSelectedBill({
                                          ...file,
                                          diary_no: file.cfo_diary_number,
                                          party_name: file.received_from,
                                          amount: file.amount || 0
                                        });
                                        setCoveringSlipPrintDate(getLocalDateString(file.created_at));
                                        setCoveringSlipCreatedDate(getLocalDateString(file.created_at));
                                      }}
                                    >
                                      View Timeline <ArrowRight className="w-3 h-3" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                      {/* Server Pagination - Search Tab */}
                      {totalRecords > DB_PAGE_SIZE && (
                        <div className="flex items-center justify-between pt-4 border-t border-border/50">
                          <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                            Showing {records.length} of {totalRecords} records
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                              disabled={currentPage === 0 || isLoading}
                              className="h-8 text-[10px] font-black uppercase tracking-tight"
                            >
                              <ArrowLeft className="w-3 h-3 mr-1" /> Previous
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                              disabled={currentPage >= totalPages - 1 || isLoading}
                              className="h-8 text-[10px] font-black uppercase tracking-tight"
                            >
                              Next <ArrowRight className="w-3 h-3 ml-1" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex justify-between items-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedBill(null)}
                      className="gap-2 text-muted-foreground hover:text-primary transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" /> Back to Search Results
                    </Button>
                  </div>
                  {/* File Details */}
                  <Card className="glass-card border-none shadow-xl overflow-hidden">
                    <div className="h-1 bg-gradient-to-r from-primary to-blue-400" />
                    <CardHeader className="flex flex-row items-center justify-between pb-2 bg-muted/30">
                      <CardTitle className="text-lg font-bold">File Specifications</CardTitle>
                      <span className="text-xs font-mono font-bold bg-primary/10 text-primary px-3 py-1 rounded-full">{selectedBill.tracking_id}</span>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <User className="w-4 h-4 text-muted-foreground mt-1" />
                          <div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase">Party / Vendor</p>
                            <p className="font-semibold">{selectedBill.party_name}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <FileText className="w-4 h-4 text-muted-foreground mt-1" />
                          <div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase">Subject</p>
                            <p className="text-sm text-muted-foreground">{selectedBill.subject}</p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <MapPin className="w-4 h-4 text-muted-foreground mt-1" />
                          <div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase">Diary Reference</p>
                            <p className="font-mono text-sm">{selectedBill.diary_no || selectedBill.cfo_diary_number}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <Clock className="w-4 h-4 text-muted-foreground mt-1" />
                          <div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase">Amount</p>
                            <p className="font-bold text-primary">{formatCurrency(selectedBill.amount)}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Tracking Journey */}
                  <Card className="glass-card border-none shadow-xl relative">
                    <CardHeader>
                      <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <History className="w-5 h-5 text-primary" />
                        Movement History (Timeline)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pb-10 pt-4">
                      <div className="relative space-y-8 before:absolute before:inset-0 before:ml-4 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-primary/50 before:via-primary/20 before:to-transparent">
                        <h4 className="text-xs font-black uppercase text-zinc-400 tracking-widest flex items-center justify-between">
                          <span className="flex items-center gap-2"><History className="w-4 h-4" /> Movement History</span>
                          <button 
                            onClick={() => setIsJourneyMapOpen(true)}
                            className="bg-sky-500/10 text-sky-500 hover:bg-sky-500 hover:text-white transition-colors px-3 py-1.5 rounded-full text-[10px] flex items-center gap-1.5 shadow-sm"
                          >
                            <Network className="w-3.5 h-3.5" /> View Visual Map
                          </button>
                        </h4>
                        
                        <JourneyMapModal 
                          isOpen={isJourneyMapOpen} 
                          onClose={() => setIsJourneyMapOpen(false)} 
                          record={selectedBill} 
                        />

                        {selectedBill.history?.map((step: any, index: number) => (
                          <div key={index} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full border border-primary/50 bg-background text-primary shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 group-hover:bg-primary group-hover:text-white transition-colors duration-200">
                              {index === selectedBill.history.length - 1 ? <MapPin className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                            </div>
                            <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-primary/10 bg-primary/5 shadow-sm group-hover:bg-primary/10 transition-colors duration-200">
                              <div className="flex items-center justify-between space-x-2 mb-1">
                                <div className="font-bold text-sm text-primary">{step.step}</div>
                                <time className="font-mono text-[10px] text-muted-foreground">{new Date(step.date).toLocaleString()}</time>
                              </div>
                              <div className="text-xs font-semibold flex items-center gap-1 mb-2">
                                <Building2 className="w-3 h-3 text-muted-foreground" />
                                {step.location?.toUpperCase() || "PROCESSING"}
                              </div>
                              <div className="text-xs text-muted-foreground italic flex gap-1 items-start bg-background/50 p-2 rounded-md">
                                <MessageSquare className="w-3 h-3 mt-0.5 shrink-0" />
                                "{step.remarks}"
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="register" className="animate-fade-in">
          <Card className="glass-card border-none shadow-xl">
            <CardHeader className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileEdit className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold">File Registration Form</CardTitle>
                    <p className="text-sm text-muted-foreground">Register new inward files and track their forward movement</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Button variant="outline" onClick={handleFormReset} className="bg-[#0f1115] text-white border-white/10 hover:bg-[#1a1c20] font-bold px-6 h-11 rounded-xl">Reset</Button>
                  <Button onClick={handleSaveForm} disabled={isSavingForm} className="bg-[#14b8a6] text-[#0f1115] hover:bg-[#14b8a6]/90 font-black gap-2 px-6 h-11 rounded-xl shadow-lg shadow-[#14b8a6]/20">
                    {isSavingForm ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Record
                  </Button>
                </div>
              </div>
              {/* CFO Diary / Record Search */}
              <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/5 border border-primary/10">
                <Search className="w-4 h-4 text-primary shrink-0" />
                <span className="text-[11px] font-black uppercase tracking-widest text-primary/70 shrink-0 hidden sm:block">CFO Diary Search:</span>
                <Input
                  placeholder="Search by CFO Diary No, Receiving No, or Subject to load for editing..."
                  value={cfoDiarySearchQuery}
                  onChange={e => setCfoDiarySearchQuery(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleCfoDiarySearch(); }}
                  className="flex-1 h-9 text-xs bg-background/50 border-primary/20 rounded-lg focus-visible:ring-primary/50"
                />
                <Button
                  size="sm"
                  onClick={handleCfoDiarySearch}
                  disabled={isCfoDiarySearching || !cfoDiarySearchQuery.trim()}
                  className="h-9 px-4 bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-xs gap-2 shrink-0"
                >
                  {isCfoDiarySearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                  Find & Edit
                </Button>
              </div>
            </CardHeader>
            <CardContent id="registration-form-container" onKeyDown={handleKeyDown} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-6 border-t border-border/50">
              <div className="space-y-2 relative">
                <div className="flex items-center justify-between">
                  <Label className="text-xs uppercase font-bold text-muted-foreground">CFO Office Diary No <span className="text-emerald-500 text-[9px]">(Auto-Generated)</span></Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      fetchNextDiaryNumber();
                    }}
                    className="h-5 px-2 py-0 text-[10px] text-sky-400 border border-sky-400/20 hover:bg-sky-400 hover:text-white transition-colors"
                    title="Regenerate Diary Number if it already exists"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" /> Regenerate
                  </Button>
                </div>
                <Input
                  value={formData.cfo_diary_number}
                  onChange={e => setFormData({ ...formData, cfo_diary_number: e.target.value })}
                  className="bg-muted/20 border-border/50 font-mono font-bold text-primary"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs uppercase font-bold text-muted-foreground">Inward Date</Label>
                <Input
                  type="date"
                  value={formData.inward_date}
                  onChange={e => setFormData({ ...formData, inward_date: e.target.value })}
                  className="bg-muted/20 border-border/50"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs uppercase font-bold text-muted-foreground">Received From Section <span className="text-red-500">*</span></Label>
                <Input
                  placeholder="Department or Section"
                  value={formData.received_from}
                  onChange={e => setFormData({ ...formData, received_from: e.target.value })}
                  className="bg-muted/20 border-border/50"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs uppercase font-bold text-muted-foreground">Receiving Number <span className="text-red-500">*</span></Label>
                <Input
                  placeholder="Enter Receiving Number"
                  value={formData.receiving_number}
                  onChange={e => setFormData({ ...formData, receiving_number: e.target.value })}
                  className="bg-muted/20 border-border/50 font-mono border-primary/30"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs uppercase font-bold text-muted-foreground">Main Category <span className="text-red-500">*</span></Label>
                <Select
                  value={formData.mainCategory}
                  onValueChange={v => setFormData({ ...formData, mainCategory: v, subCategory: "" })}
                >
                  <SelectTrigger className="bg-muted/20 border-border/50">
                    <SelectValue placeholder="Select Main Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {dynMainCats.map(mc => (
                      <SelectItem key={mc.config_key} value={mc.config_key}>{mc.config_label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs uppercase font-bold text-muted-foreground">Sub Category {formData.mainCategory !== 'impress' && formData.mainCategory !== 'pol_bills' && <span className="text-red-500">*</span>}</Label>
                <Select
                  value={formData.subCategory}
                  onValueChange={v => setFormData({ ...formData, subCategory: v })}
                  disabled={!formData.mainCategory}
                >
                  <SelectTrigger className="bg-muted/20 border-border/50">
                    <SelectValue placeholder={formData.mainCategory ? "Select Sub Category" : "Select Main Category First"} />
                  </SelectTrigger>
                  <SelectContent>
                    {formData.mainCategory && getSubCategoriesFor(dynSubCats, formData.mainCategory).map(sc => (
                      <SelectItem key={sc.config_key} value={sc.config_key}>{sc.config_label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Conditional Field: Employee Number */}
              {formData.mainCategory === 'employee' && formData.subCategory && (
                <div className="space-y-2 animate-in slide-in-from-left-2 duration-300 relative">
                  <Label className="text-xs uppercase font-bold text-sky-500 flex items-center gap-2">
                    <User className="w-3 h-3" /> Employee / Pension Number
                  </Label>
                  <div className="relative">
                    <Input
                      placeholder="Type Name, Emp No, or Pension No..."
                      value={formData.employee_number}
                      onChange={e => handleEmployeeNumberChange(e.target.value)}
                      onFocus={() => { if (empSuggestions.length > 0) setShowEmpSuggestions(true); }}
                      className="bg-sky-500/5 border-sky-500/30 font-bold focus-visible:ring-sky-500 pr-8 font-mono text-sm"
                    />
                    {isSearchingEmp && (
                      <div className="absolute right-2.5 top-2.5">
                        <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
                      </div>
                    )}
                  </div>

                  {/* Suggestions Popover Dropdown */}
                  {showEmpSuggestions && empSuggestions.length > 0 && (
                    <div className="mt-2 max-h-60 overflow-y-auto rounded-lg border border-white/10 bg-[#0f1115]/95 backdrop-blur-xl shadow-2xl p-1 space-y-0.5 scrollbar-thin">
                      <div className="p-1.5 text-[9px] uppercase font-bold text-sky-400/60 tracking-wider border-b border-white/5">
                        Lookup matches found
                      </div>
                      {empSuggestions.map((emp) => {
                        const num = emp.employee_no || emp.pension_no || "N/A";
                        return (
                          <div
                            key={emp.id}
                            onClick={() => handleSelectEmployee(emp)}
                            className="flex flex-col gap-0.5 p-2 rounded-md hover:bg-sky-500/10 cursor-pointer transition-colors text-left"
                          >
                            <span className="text-xs font-bold text-white">{emp.full_name}</span>
                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono">
                              <span className="text-sky-400 font-semibold">{num}</span>
                              <span>•</span>
                              <span className="uppercase text-[9px] px-1 bg-white/5 rounded">{emp.category}</span>
                              {emp.source_tab && (
                                <>
                                  <span>•</span>
                                  <span className="text-[9px] text-purple-400 font-semibold uppercase">{emp.source_tab}</span>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Verified Employee Summary Profile Card */}
                  {selectedEmpProfile && (
                    <div className="mt-4 p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 backdrop-blur-md space-y-3 animate-in fade-in zoom-in-95 duration-300 shadow-inner col-span-full">
                      <div className="flex items-center justify-between border-b border-emerald-500/15 pb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          </div>
                          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Verified KWSC Staff Profile</span>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[8px] font-bold uppercase bg-emerald-500/20 text-emerald-400">
                          {selectedEmpProfile.category}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs">
                        <div className="space-y-0.5">
                          <span className="text-[9px] text-muted-foreground uppercase font-medium">Full Name</span>
                          <p className="font-bold text-white text-sm truncate">{selectedEmpProfile.full_name}</p>
                        </div>
                        <div className="space-y-0.5 font-mono">
                          <span className="text-[9px] text-muted-foreground uppercase font-medium">Employee / Pen No</span>
                          <p className="font-bold text-white text-xs">{selectedEmpProfile.employee_no || selectedEmpProfile.pension_no || "---"}</p>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[9px] text-muted-foreground uppercase font-medium">Original source sheet</span>
                          <p className="font-bold text-sky-400 text-xs font-mono uppercase">{selectedEmpProfile.source_tab || "UNIFIED"}</p>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[9px] text-muted-foreground uppercase font-medium">Sanctioned Net Amount</span>
                          <p className="font-bold text-emerald-400 font-mono text-sm">
                            Rs. {(selectedEmpProfile.cheque_amount || selectedEmpProfile.total_amount || 0).toLocaleString()}
                          </p>
                        </div>
                        {selectedEmpProfile.bank_details && (
                          <div className="col-span-2 space-y-0.5 pt-1 border-t border-emerald-500/10">
                            <span className="text-[9px] text-muted-foreground uppercase font-medium">Bank details</span>
                            <p className="text-white/80 italic text-[11px] truncate">{selectedEmpProfile.bank_details}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Conditional Field: Voucher Code */}
              {formData.mainCategory === 'contractor' && formData.subCategory && (
                <div className="space-y-2 animate-in slide-in-from-left-2 duration-300">
                  <Label className="text-xs uppercase font-bold text-emerald-500 flex items-center gap-2">
                    <FileText className="w-3 h-3" /> Voucher Code
                  </Label>
                  <Input
                    placeholder="Enter Voucher Reference"
                    value={formData.voucher_code}
                    onChange={e => setFormData({ ...formData, voucher_code: e.target.value })}
                    className="bg-emerald-500/5 border-emerald-500/30 font-bold focus-visible:ring-emerald-500"
                  />
                </div>
              )}

              {/* Conditional Field: Vehicle No */}
              {((formData.mainCategory === 'contractor' && formData.subCategory === 'pol_bills') || formData.mainCategory === 'pol_bills') && (
                <div className="space-y-2 animate-in slide-in-from-left-2 duration-300">
                  <Label className="text-xs uppercase font-bold text-orange-500 flex items-center gap-2">
                    <MapPin className="w-3 h-3" /> Vehicle No (Optional)
                  </Label>
                  <Input
                    placeholder="Enter Vehicle Number"
                    value={formData.vehicle_no}
                    onChange={e => setFormData({ ...formData, vehicle_no: e.target.value })}
                    className="bg-orange-500/5 border-orange-500/30 font-bold focus-visible:ring-orange-500"
                  />
                </div>
              )}

              <div className="space-y-2 lg:col-span-1">
                <Label className="text-xs uppercase font-bold text-muted-foreground">Subject <span className="text-red-500">*</span></Label>
                <Input
                  placeholder="Purpose of file"
                  value={formData.subject}
                  onChange={e => setFormData({ ...formData, subject: e.target.value })}
                  className="bg-muted/20 border-border/50"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs uppercase font-bold text-muted-foreground">Amount (PKR) <span className="text-emerald-500 text-[9px]">(Net Amount)</span></Label>
                <Input
                  type="number"
                  placeholder="Enter Amount"
                  value={formData.amount}
                  onChange={e => setFormData({ ...formData, amount: Number(e.target.value) })}
                  className="bg-muted/20 border-border/50 font-bold text-primary"
                />
              </div>

              <div className="space-y-4">
                <Label className="text-xs uppercase font-bold text-muted-foreground">Digital Authorization (E-Signature)</Label>

                {!formData.signature_data ? (
                  <Dialog open={isSignDialogOpen} onOpenChange={setIsSignDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full border-dashed border-2 h-20 flex flex-col gap-1 hover:bg-primary/5 hover:border-primary/50 transition-all">
                        <PenTool className="w-5 h-5 text-muted-foreground" />
                        <span className="text-[10px] font-bold uppercase">Click to Sign Digitally</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <FileSignature className="w-5 h-5 text-primary" />
                          Draw Your E-Signature
                        </DialogTitle>
                        <DialogDescription>
                          Choose to draw your signature or upload an image of your physical signature.
                        </DialogDescription>
                      </DialogHeader>

                      <Tabs defaultValue="draw" className="w-full mt-4">
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="draw" className="gap-2">
                            <PenTool className="w-4 h-4" /> Draw
                          </TabsTrigger>
                          <TabsTrigger value="upload" className="gap-2">
                            <Upload className="w-4 h-4" /> Upload
                          </TabsTrigger>
                        </TabsList>

                        <TabsContent value="draw" className="flex flex-col items-center gap-4 py-4 animate-in fade-in-50 duration-300">
                          <div className="border-2 border-border rounded-lg bg-white overflow-hidden touch-none">
                            <canvas
                              ref={canvasRef}
                              width={450}
                              height={200}
                              onMouseDown={startDrawing}
                              onMouseUp={stopDrawing}
                              onMouseMove={draw}
                              onMouseLeave={stopDrawing}
                              onTouchStart={startDrawing}
                              onTouchEnd={stopDrawing}
                              onTouchMove={draw}
                              className="cursor-crosshair"
                            />
                          </div>
                          <div className="flex w-full justify-between">
                            <Button variant="ghost" size="sm" onClick={clearCanvas} className="text-destructive hover:text-destructive gap-2">
                              <ResetIcon className="w-4 h-4" /> Clear Pad
                            </Button>
                            <p className="text-[10px] text-muted-foreground italic self-center">Verification Stamp will be added automatically</p>
                          </div>
                          <div className="w-full flex justify-end gap-2 mt-2">
                            <Button variant="outline" onClick={() => setIsSignDialogOpen(false)}>Cancel</Button>
                            <Button onClick={saveSignature} className="bg-primary hover:bg-primary/90 gap-2">
                              Apply Signature <Check className="w-4 h-4" />
                            </Button>
                          </div>
                        </TabsContent>

                        <TabsContent value="upload" className="flex flex-col items-center gap-6 py-10 animate-in slide-in-from-bottom-2 duration-300">
                          <div
                            className="w-full max-w-[300px] border-2 border-dashed border-border rounded-xl p-10 flex flex-col items-center gap-4 hover:border-primary/50 hover:bg-primary/5 cursor-pointer transition-all group"
                            onClick={() => document.getElementById('signature-image-upload')?.click()}
                          >
                            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                              <ImageIcon className="w-8 h-8" />
                            </div>
                            <div className="text-center">
                              <p className="text-sm font-bold">Select Signature Image</p>
                              <p className="text-[10px] text-muted-foreground mt-1">PNG, JPG or JPEG (Max 2MB)</p>
                            </div>
                            <input
                              type="file"
                              id="signature-image-upload"
                              hidden
                              accept="image/*"
                              onChange={handleSignatureUpload}
                            />
                          </div>
                          <p className="text-center text-[10px] text-muted-foreground max-w-[300px]">
                            Tip: For best results, use a high-contrast image (black ink on white paper).
                          </p>
                        </TabsContent>
                      </Tabs>
                    </DialogContent>
                  </Dialog>
                ) : (
                  <div className="relative group">
                    <div className="border-2 border-emerald-500/30 rounded-lg p-2 bg-emerald-500/5 flex flex-col items-center overflow-hidden">
                      <img src={formData.signature_data} alt="ESign" className="max-h-16 mix-blend-multiply" />
                      <div className="mt-2 text-[8px] font-mono text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        VERIFIED: {new Date(formData.date_of_sign).toLocaleDateString()}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                      onClick={() => setFormData({ ...formData, signature_data: "" })}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-xs uppercase font-bold text-muted-foreground">Date of Sign</Label>
                <Input
                  type="date"
                  value={formData.date_of_sign}
                  onChange={e => setFormData({ ...formData, date_of_sign: e.target.value })}
                  className="bg-muted/20 border-border/50 text-blue-500 font-bold"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs uppercase font-bold text-muted-foreground">Mark To (Forward) <span className="text-red-500">*</span></Label>
                <Select value={formData.mark_to} onValueChange={v => setFormData({ ...formData, mark_to: v })}>
                  <SelectTrigger className="bg-muted/20 border-border/50 border-primary/30">
                    <SelectValue placeholder="Target Section" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-primary/20 text-white">
                    {sections.map(section => (
                      <SelectItem key={section.id} value={section.id} className="font-bold uppercase tracking-tight">
                        {section.name} {section.id === 'books' || section.id === 'establishment' ? '(NEW)' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs uppercase font-bold text-muted-foreground">Outward (Forwarding) Date</Label>
                <Input
                  type="date"
                  value={formData.outward_date}
                  onChange={e => setFormData({ ...formData, outward_date: e.target.value })}
                  className="bg-muted/20 border-border/50"
                />
              </div>

                <>
                  <div className="space-y-2">
                    <Label className="text-xs uppercase font-bold text-amber-500 flex items-center gap-2">
                      <Calendar className="w-3 h-3" />
                      Registration Date
                      <span className="text-[9px] font-normal text-muted-foreground normal-case">(Backward date allowed)</span>
                    </Label>
                    <Input
                      type="date"
                      value={formData.registration_date}
                      onChange={e => setFormData({ ...formData, registration_date: e.target.value, print_date: e.target.value })}
                      className="bg-amber-500/5 border-amber-500/30 text-amber-500 font-bold focus-visible:ring-amber-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs uppercase font-bold text-emerald-500 flex items-center gap-2">
                      <Printer className="w-3 h-3" />
                      Print Date
                      <span className="text-[9px] font-normal text-muted-foreground normal-case">(Shown on print slip)</span>
                    </Label>
                    <Input
                      type="date"
                      value={formData.print_date}
                      onChange={e => setFormData({ ...formData, print_date: e.target.value })}
                      className="bg-emerald-500/5 border-emerald-500/30 text-emerald-500 font-bold focus-visible:ring-emerald-500"
                    />
                  </div>
                </>

              <div className="space-y-2 lg:col-span-3">
                <Label className="text-xs uppercase font-bold text-muted-foreground">Remarks</Label>
                <Input
                  placeholder="Any additional notes..."
                  value={formData.remarks}
                  onChange={e => setFormData({ ...formData, remarks: e.target.value })}
                  className="bg-muted/20 border-border/50"
                />
              </div>
            </CardContent>

            {/* Journey History at the Bottom */}
            {records.find(r => r.receiving_number === formData.receiving_number) && (
              <div className="border-t border-border/50 bg-muted/10 p-6">
                <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-6 flex items-center gap-2">
                  <History className="w-5 h-5" /> Detailed File Movement Record
                </h3>
                <div className="space-y-0 ml-4 border-l-2 border-primary/20">
                  {records.find(r => r.receiving_number === formData.receiving_number)?.history.map((step: any, i: number) => (
                    <div key={i} className="relative pb-8 pl-8 last:pb-0">
                      <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 mb-1">
                        <span className="text-xs font-black text-primary uppercase bg-primary/10 px-2 py-0.5 rounded">Action Log #{i + 1}</span>
                        <span className="text-[10px] font-mono text-muted-foreground">{safeFormatDate(step.date)}</span>
                      </div>
                      <div className="bg-background rounded-lg border border-border p-3 shadow-sm hover:border-primary/50 transition-colors">
                        <div className="flex items-center justify-between gap-4 text-sm font-bold mb-2 pb-2 border-b border-border/50">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            {step.processed_by}
                          </div>

                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1 hover:bg-primary/10 text-primary">
                                <FileSearch className="w-3 h-3" /> View Log Details
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Log Snapshot: {step.processed_by}</DialogTitle>
                                <DialogDescription>Full data captured at {new Date(step.date).toLocaleString()}</DialogDescription>
                              </DialogHeader>
                              <div className="grid grid-cols-2 gap-4 mt-4 p-4 bg-muted/20 rounded-xl border border-border">
                                <div>
                                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Main Category</p>
                                  <p className="text-sm font-semibold">{mainCatReadable(step.mainCategory).toUpperCase()}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Sub Category</p>
                                  <p className="text-sm font-semibold">{step.subCategory.replace(/_/g, " ").toUpperCase()}</p>
                                </div>
                                <div className="col-span-2">
                                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Subject</p>
                                  <p className="text-sm font-semibold bg-background p-2 rounded border border-border/50">{step.subject}</p>
                                </div>
                                <div className="col-span-2">
                                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Remarks</p>
                                  <p className="text-xs text-muted-foreground italic bg-background p-2 rounded border border-border/20">&ldquo;{step.remarks}&rdquo;</p>
                                </div>
                                {step.employee_number && (
                                  <div>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Employee Number</p>
                                    <p className="text-sm font-semibold">{step.employee_number}</p>
                                  </div>
                                )}
                                {step.voucher_code && (
                                  <div>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Voucher Code</p>
                                    <p className="text-sm font-semibold">{step.voucher_code}</p>
                                  </div>
                                )}
                                {step.vehicle_no && (
                                  <div>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Vehicle No</p>
                                    <p className="text-sm font-semibold">{step.vehicle_no}</p>
                                  </div>
                                )}
                                {step.signature_data && (
                                  <div className="col-span-2">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase mb-2">Digital Signature</p>
                                    <img src={step.signature_data} alt="Sign" className="h-16 border rounded bg-white p-1" />
                                  </div>
                                )}
                                <div>
                                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Marked To</p>
                                  <Badge>{step.mark_to.toUpperCase()}</Badge>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                        <p className="text-xs text-muted-foreground italic line-clamp-2">&ldquo;{step.remarks}&rdquo;</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* View Only Tab - read‑only view for file_viewer */}
        <TabsContent value="view_only" className="animate-fade-in">
          <Card className="glass-card border-none shadow-xl">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Eye className="w-6 h-6 text-primary" /> View Only
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Read‑only list of files for your department</p>
            </CardHeader>
            <CardContent>
              {records.length === 0 ? (
                <p className="text-center py-10 text-white/40 italic">No records available for viewing.</p>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-xl border border-border/50 overflow-hidden bg-background/40">
                    <Table>
                      <TableHeader className="bg-muted/50 text-[10px] uppercase font-black tracking-tighter">
                        <TableRow>
                          <TableHead>Diary #</TableHead>
                          <TableHead>Ref/Sub</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>From & Mark To</TableHead>
                          <TableHead>Created At</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead className="text-right pr-6">Export</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {records.map((file, i) => (
                          <TableRow key={i} className="hover:bg-primary/5 border-border/30 transition-colors">
                            <TableCell className="font-mono text-[10px] font-bold text-primary">{file.cfo_diary_number}</TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-bold text-xs">{file.subject}</span>
                                <span className="text-[10px] text-muted-foreground italic">{file.receiving_number}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                <Badge variant="outline" className="text-[9px] uppercase border-primary/20">{mainCatReadable(file.mainCategory)}</Badge>
                                {file.subCategory && (
                                  <span className="text-[8px] text-muted-foreground uppercase font-bold italic">
                                    {file.subCategory.replace(/_/g, " ")}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-[10px]">
                              <div className="flex flex-col gap-0.5">
                                <span className="text-muted-foreground">F: {file.received_from}</span>
                                <span className="text-emerald-500 font-bold">M: {sections.find(s => s.id === file.mark_to)?.name}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-[10px] font-mono text-muted-foreground">
                              {new Date(file.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="font-bold text-[10px] text-primary">
                              {formatCurrency(file.amount || 0)}
                            </TableCell>
                            <TableCell className="text-right pr-6">
                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 hover:text-emerald-500"
                                  onClick={() => exportToCSV([file], `Report_${file.receiving_number}`)}
                                >
                                  <Upload className="w-3.5 h-3.5 rotate-180" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 hover:text-red-400"
                                  onClick={() => handlePrintFullReport([file])}
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 hover:text-blue-500"
                                  onClick={() => handleQRClick(file.cfo_diary_number, file.receiving_number, getLocalDateString(file.created_at), getLocalDateString(file.created_at))}
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  
                  {/* Server Pagination - View Only */}
                  {totalRecords > DB_PAGE_SIZE && (
                    <div className="flex items-center justify-between pt-4 border-t border-border/50">
                      <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                        Showing {records.length} of {totalRecords} records
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                          disabled={currentPage === 0 || isLoading}
                          className="h-8 text-[10px] font-black uppercase tracking-tight"
                        >
                          <ArrowLeft className="w-3 h-3 mr-1" /> Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                          disabled={currentPage >= totalPages - 1 || isLoading}
                          className="h-8 text-[10px] font-black uppercase tracking-tight"
                        >
                          Next <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cfo_all_files" className="mt-6 space-y-6">
          <Card className="glass-card border-none shadow-2xl">
            <CardHeader className="flex flex-col md:flex-row md:items-center justify-between pb-6 gap-4">
              <div>
                <CardTitle className="text-2xl font-black flex items-center gap-3">
                  <Building2 className="w-6 h-6 text-[#14b8a6]" />
                  CFO Dashboard
                </CardTitle>
                <p className="text-xs text-white/40 mt-2 font-medium">Manage and exit files across all departments</p>
              </div>
              <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                <div className="relative group">
                  <Input 
                    value={scanInput}
                    onChange={(e) => setScanInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleScanExit(scanInput);
                    }}
                    placeholder="Scan QR to Exit..."
                    className="w-full md:w-[250px] pl-10 bg-[#111318] border-white/10 text-white font-bold h-10 transition-all focus:border-[#14b8a6] focus:ring-1 focus:ring-[#14b8a6]"
                    disabled={isScanning}
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-[#14b8a6] transition-colors">
                    {isScanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScanLine className="w-4 h-4" />}
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <Select value={filterStatus} onValueChange={(val: 'active' | 'exited') => setFilterStatus(val)}>
                    <SelectTrigger className="w-[150px] bg-[#0f1115] border-white/10 text-white font-bold h-10">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0f1115] border-white/10 text-white">
                      <SelectItem value="active">Active Files</SelectItem>
                      <SelectItem value="exited">Exited Files</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={filterSection} onValueChange={setFilterSection}>
                    <SelectTrigger className="w-[180px] bg-[#0f1115] border-white/10 text-white font-bold h-10">
                      <SelectValue placeholder="All Sections" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0f1115] border-white/10 text-white max-h-[300px]">
                      <SelectItem value="all">All Sections</SelectItem>
                      {sections.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-2xl border border-white/5 overflow-hidden bg-black/20">
                <Table>
                  <TableHeader className="bg-white/5">
                    <TableRow>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest">Diary No</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest">Subject</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest">Category</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest">Amount</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest">Marked To</TableHead>
                      <TableHead className="text-right font-black text-[10px] uppercase tracking-widest pr-6">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-32 text-center text-white/30 font-medium">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#14b8a6]" />
                        </TableCell>
                      </TableRow>
                    ) : records.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-32 text-center text-white/30 font-medium">No files found matching criteria.</TableCell>
                      </TableRow>
                    ) : (
                      records.map((file, i) => (
                        <TableRow key={i} className="hover:bg-white/5 border-white/5 transition-colors">
                          <TableCell className="font-mono text-xs font-bold text-[#14b8a6]">{file.cfo_diary_number}</TableCell>
                          <TableCell>
                            <div className="font-semibold text-sm">{file.subject}</div>
                            <div className="text-[10px] text-white/40">{file.receiving_number}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[9px] uppercase border-white/10 bg-white/5">{mainCatReadable(file.mainCategory)}</Badge>
                          </TableCell>
                          <TableCell className="font-black text-xs text-emerald-400">{formatCurrency(file.amount || 0)}</TableCell>
                          <TableCell>
                            {file.mark_to === 'exited' ? (
                              <Badge className="bg-red-500/20 text-red-400 border-none text-[10px] uppercase font-bold">EXITED</Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px] uppercase border-white/10 bg-white/5">
                                {sections.find(s => s.id === file.mark_to)?.name || file.mark_to}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right pr-6">
                            <div className="flex justify-end gap-2">
                              {file.mark_to !== 'exited' && (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="h-8 border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300 font-bold text-[10px] uppercase tracking-widest"
                                  onClick={() => {
                                    setExitModalFile(file);
                                    setExitModalScanInput("");
                                  }}
                                  disabled={isExitingFile}
                                >
                                  {isExitingFile ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Trash2 className="w-3 h-3 mr-2" />}
                                  Exit
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:text-[#14b8a6]"
                                onClick={() => handleQRClick(file.cfo_diary_number, file.receiving_number, getLocalDateString(file.created_at), getLocalDateString(file.created_at))}
                              >
                                <Printer className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              
              {/* Pagination */}
              {totalRecords > DB_PAGE_SIZE && (
                <div className="flex items-center justify-between pt-6 mt-6 border-t border-white/5">
                  <div className="text-[10px] text-white/40 font-bold uppercase tracking-widest">
                    Showing {records.length} of {totalRecords} records
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                      disabled={currentPage === 0 || isLoading}
                      className="h-8 bg-transparent border-white/10 text-white hover:bg-white/5 text-[10px] font-black uppercase tracking-tight"
                    >
                      <ArrowLeft className="w-3 h-3 mr-1" /> Prev
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                      disabled={currentPage >= totalPages - 1 || isLoading}
                      className="h-8 bg-transparent border-white/10 text-white hover:bg-white/5 text-[10px] font-black uppercase tracking-tight"
                    >
                      Next <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <style>{`
        ${isPrintingQR ? `
          @media print {
            body * { 
              visibility: visible !important; 
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
            .no-print { display: none !important; }
            @page { size: auto; margin: 0; }
          }
        ` : ''}
        ${isPrintingCovering ? `
          @media print {
            @page { size: A5 portrait; margin: 0; }
          }
        ` : ''}
        
        @media screen {
          /* Dashboard Dark Theme Overrides for Ticket Modal */
          [data-radix-portal] .bg-zinc-950, [data-radix-portal] .bg-slate-50 { background-color: #09090b !important; }
          [data-radix-portal] .bg-white { background-color: #18181b !important; border: 1px solid rgba(255,255,255,0.1) !important; }
          [data-radix-portal] .text-zinc-800, [data-radix-portal] .text-zinc-400 { color: #f4f4f5 !important; }
          [data-radix-portal] .bg-slate-50.rounded-2xl { background-color: #27272a !important; border: 1px solid rgba(255,255,255,0.05) !important; }
          [data-radix-portal] .border-zinc-100 { border-color: rgba(255,255,255,0.05) !important; }
        }
      `}</style>

      {/* Hidden Printable Covering Page */}
      <div className={`print-only hidden ${isPrintingCovering ? '' : 'no-print'}`}>
        <div ref={printRef} className="p-6 font-sans text-black bg-white min-h-[210mm] w-[148mm] mx-auto relative overflow-hidden">
          {/* Header */}
          <div className="text-center border-b-2 border-black pb-4 mb-4 flex justify-between items-end">
            <div className="text-left">
              <h1 className="text-xl font-black uppercase tracking-tighter">Karachi Water Corporation</h1>
              <h2 className="text-sm font-bold uppercase mt-1">Finance Department - File Movement Slip</h2>
              <div className="flex gap-4 mt-2 font-mono text-[10px]">
                <span>Ref No: {selectedBill?.diary_no}</span>
                <span>Tracking ID: {selectedBill?.tracking_id}</span>
              </div>
            </div>
            {selectedBill && (
              <div className="flex flex-col items-center gap-1">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(`${window.location.origin}/public-track/${selectedBill.cfo_diary_number || selectedBill.diary_no}/${selectedBill.receiving_number || selectedBill.tracking_id}?sec=${selectedBill.mark_to || selectedBill.current_status || 'CFO'}`)}`}
                  alt="QR Code"
                  className="w-24 h-24 border border-black p-1"
                />
                <span className="text-[7px] font-bold mt-1 max-w-[100px] text-center uppercase">Prepared by Engineer Tariq Zamir</span>
                <span className="text-[8px] font-bold font-mono">{selectedBill.receiving_number || selectedBill.tracking_id}</span>
              </div>
            )}
          </div>

          {/* File Overview */}
          <div className="grid grid-cols-2 gap-8 mb-10">
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-bold uppercase text-gray-500">Party / Vendor Name</p>
                <p className="text-base font-bold underline underline-offset-4">{selectedBill?.party_name}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-gray-500">Subject / Nature of Work</p>
                <p className="text-sm border-b border-dotted border-gray-400 pb-1">{selectedBill?.subject}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-bold uppercase text-gray-500">Created Date</p>
                <p className="text-base font-bold">{safeFormatDate(coveringSlipCreatedDate)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-gray-500">Printed Date</p>
                <p className="text-sm font-semibold">
                  {safeFormatDate(coveringSlipPrintDate)}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-gray-500">Amount Claimed</p>
                <p className="text-base font-bold">{formatCurrency(selectedBill?.amount)}</p>
              </div>
            </div>
          </div>

          {/* Movement Table */}
          <div className="mt-8">
            <h3 className="text-sm font-bold uppercase mb-4 bg-gray-100 p-2">Chronological Movement Record</h3>
            <table className="w-full border-collapse border border-black text-xs">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-black p-2 text-left w-12">SN</th>
                  <th className="border border-black p-2 text-left">Department / Section</th>
                  <th className="border border-black p-2 text-left">Date & Time</th>
                  <th className="border border-black p-2 text-left">Action Taken / Remarks</th>
                  <th className="border border-black p-2 text-left w-24">Signature</th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => {
                  const step = selectedBill?.history?.[i - 1];
                  return (
                    <tr key={i} className="h-16">
                      <td className="border border-black p-2 text-center font-bold">{i}</td>
                      <td className="border border-black p-2 text-sm font-semibold">{step?.location || ""}</td>
                      <td className="border border-black p-2 font-mono text-[10px]">{step ? new Date(step.date).toLocaleString() : ""}</td>
                      <td className="border border-black p-2 text-gray-600">{step?.remarks || ""}</td>
                      <td className="border border-black p-2"></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="absolute bottom-10 left-10 right-10 flex justify-between items-end border-t border-black pt-4">
            <div className="text-[10px] font-mono">
              <p>Generated by: FinLedger Software</p>
              <p>Printed Date: {new Date().toLocaleString()}</p>
            </div>
            <div className="text-center w-48">
              <div className="border-t border-black mb-1"></div>
              <p className="text-[10px] font-bold uppercase">Section Officer (Finance)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Full Screen Ticket & QR Modal (Matches Public Tracking Layout) */}
      <Dialog open={!!qrFullScreen} onOpenChange={(open) => !open && setQrFullScreen(null)}>
        <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden rounded-[40px] border-none bg-zinc-950 shadow-2xl">
          {(() => {
            const ticket = qrFullScreen ? records.find(r => r.cfo_diary_number === qrFullScreen.diary || r.receiving_number === qrFullScreen.receiving) : null;
            return (
              <div className={`w-full h-full ${isPrintingQR ? 'overflow-visible max-h-none' : 'max-h-[90vh] overflow-y-auto'} overflow-x-hidden font-sans pb-6`}>
                {/* Header */}
                <div className="bg-primary px-6 pt-8 pb-16 rounded-b-[40px] shadow-2xl relative overflow-hidden shrink-0">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                  <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full -ml-10 -mb-10 blur-2xl"></div>

                  <div className="relative flex justify-center items-center mb-4">
                    <ShieldCheck className="w-10 h-10 text-emerald-400" />
                  </div>

                  <div className="relative text-center space-y-1">
                    <h1 className="text-white text-xl font-black tracking-tighter uppercase">Verified Tracking</h1>
                    <p className="text-primary-foreground/70 text-[10px] font-bold uppercase tracking-widest">Karachi Water Corporation</p>
                  </div>
                </div>

                {/* Main Content Card */}
                <div className="px-5 -mt-10 relative z-10 shrink-0">
                  <Card className="rounded-[30px] border-none shadow-xl overflow-hidden bg-white">
                    <div className="p-1 bg-gradient-to-r from-emerald-500 to-primary"></div>
                    <CardContent className="pt-6 space-y-6">

                      {/* Tracking Numbers */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-50 rounded-2xl p-4 text-center border-2 border-primary/5 relative group overflow-hidden">
                          <span className="text-[9px] font-black text-primary/50 uppercase tracking-[0.1em]">CFO Diary</span>
                          <p className="text-sm font-black text-zinc-800 font-mono mt-1 tracking-tighter">{qrFullScreen?.diary}</p>
                        </div>
                        <div className="bg-slate-50 rounded-2xl p-4 text-center border-2 border-emerald-500/5 relative group overflow-hidden">
                          <span className="text-[9px] font-black text-emerald-500/50 uppercase tracking-[0.1em]">Receiving No</span>
                          <p className="text-sm font-black text-zinc-800 font-mono mt-1 tracking-tighter">{qrFullScreen?.receiving}</p>
                        </div>
                      </div>

                      {/* File Info */}
                      <div className="space-y-4 pt-4 border-t border-zinc-100">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-[9px] font-bold text-zinc-400 uppercase">Subject</span>
                            <p className="text-xs font-bold text-zinc-800 leading-tight">{ticket?.subject || "Subject Details"}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 shrink-0">
                            <Calendar className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-[9px] font-bold text-zinc-400 uppercase">Created Date</span>
                            <p className="text-xs font-black text-amber-600 tracking-tight">{safeFormatDate(qrFullScreen?.created_date)}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                            <Clock className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-[9px] font-bold text-zinc-400 uppercase">Printed Date</span>
                            <p className="text-xs font-black text-emerald-600 tracking-tight">
                              {safeFormatDate(qrFullScreen?.print_date)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 shrink-0">
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-[9px] font-bold text-zinc-400 uppercase">Current Section</span>
                            <p className="text-xs font-black text-blue-600 uppercase tracking-tight">{ticket?.mark_to || "CFO Office"}</p>
                          </div>
                        </div>
                      </div>

                      {/* QR Section */}
                      <div className="mt-4 p-5 bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-[30px] flex flex-col items-center gap-4 text-center shadow-inner print:bg-white print:border-none print:shadow-none">
                        <div className="bg-white p-3 rounded-2xl shadow-xl border-4 border-[#0ea5e9]/20 flex flex-col items-center">
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`${window.location.origin}/public-track/${qrFullScreen?.diary}/${qrFullScreen?.receiving}`)}&color=0ea5e9`}
                            alt="QR"
                            className="w-28 h-28"
                          />
                          <span className="text-[8px] font-bold mt-2 text-zinc-600 uppercase text-center">Prepared by Engineer Tariq Zamir</span>
                        </div>
                        <div>
                          <p className="text-primary text-sm font-black uppercase tracking-widest print:text-primary">Scan to Track Live</p>
                          <p className="text-zinc-400 text-[10px] font-medium tracking-tight mt-1 print:text-zinc-400 font-mono">CODE: {qrFullScreen?.receiving}</p>
                        </div>
                      </div>

                      <div className="pt-2 flex flex-col gap-2 justify-center">
                        <div className="no-print space-y-2 mb-2 bg-slate-500/5 p-3 rounded-lg border border-slate-500/20">
                          <div>
                            <label className="text-[10px] uppercase font-bold text-amber-600">Override Created Date</label>
                            <input
                              type="date"
                              value={qrFullScreen?.created_date || ''}
                              onChange={e => setQrFullScreen({ ...qrFullScreen!, created_date: e.target.value })}
                              className="w-full h-8 text-xs bg-white border border-amber-500/30 text-amber-600 font-bold rounded-md px-2 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] uppercase font-bold text-emerald-600">Override Print Date</label>
                            <input
                              type="date"
                              value={qrFullScreen?.print_date || ''}
                            onChange={e => setQrFullScreen({ ...qrFullScreen!, print_date: e.target.value })}
                            className="w-full h-8 text-xs bg-white border border-emerald-500/30 text-emerald-600 font-bold rounded-md px-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                          />
                          </div>
                        </div>
                        <Button
                          className={`w-full bg-primary hover:bg-primary/90 text-white font-bold rounded-xl no-print`}
                          onClick={handlePrintQR}
                        >
                          <Printer className="w-4 h-4 mr-2" /> Print Tracking Slip
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Minimal Thermal Printer Content (QR + Diary Only) */}
                <div className="thermal-only">
                  <div style={{ marginRight: '2mm' }}>
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(`${window.location.origin}/public-track/${qrFullScreen?.diary}/${qrFullScreen?.receiving}`)}&color=000000&margin=0`}
                      alt="Thermal QR"
                      style={{ width: '11mm', height: '11mm' }}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', flex: 1, overflow: 'hidden' }}>
                    <p style={{ fontSize: '10pt', fontWeight: '900', margin: '0', color: 'black', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                      D: {qrFullScreen?.diary}
                    </p>
                  </div>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="bg-[#0f1115] border-white/10 text-white sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-red-500 flex items-center gap-2">
              <Trash2 className="w-5 h-5" /> Confirm Deletion
            </DialogTitle>
            <DialogDescription className="text-white/60">
              Please enter your password to confirm deletion of this file tracking record. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-white/50">Your Password</label>
              <Input
                type="password"
                placeholder="Enter password..."
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                className="bg-[#111318] border-white/5 text-white placeholder:text-white/20"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleDeleteRecord();
                }}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              className="bg-transparent border-white/10 text-white/70 hover:text-white hover:bg-white/5"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setDeletePassword("");
              }}
            >
              Cancel
            </Button>
            <Button
              className="bg-red-500 hover:bg-red-600 text-white font-bold"
              onClick={handleDeleteRecord}
              disabled={!deletePassword}
            >
              Delete Record
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Confirmation Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="bg-[#0f1115] border-white/10 text-white sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-blue-500 flex items-center gap-2">
              <FileEdit className="w-5 h-5" /> Edit Record Authorization
            </DialogTitle>
            <DialogDescription className="text-white/60">
              Please enter your password to authorize editing this file tracking record.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-white/50">Your Password</label>
              <Input
                type="password"
                placeholder="Enter password..."
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
                className="bg-[#111318] border-white/5 text-white placeholder:text-white/20"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleEditRecordAuth();
                }}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              className="bg-transparent border-white/10 text-white/70 hover:text-white hover:bg-white/5"
              onClick={() => {
                setIsEditModalOpen(false);
                setEditPassword("");
              }}
            >
              Cancel
            </Button>
            <Button
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold"
              onClick={handleEditRecordAuth}
              disabled={!editPassword}
            >
              Authorize Edit
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Specific File Scan Exit Confirmation Modal */}
      <Dialog open={!!exitModalFile} onOpenChange={(open) => {
        if (!open) {
          setExitModalFile(null);
          setExitModalScanInput("");
        }
      }}>
        <DialogContent className="bg-[#0f1115] border-white/10 text-white sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-[#14b8a6] flex items-center gap-2">
              <ScanLine className="w-5 h-5" /> Confirm Exit by Scanning
            </DialogTitle>
            <DialogDescription className="text-white/60">
              Please scan the QR code for <strong className="text-white">{exitModalFile?.cfo_diary_number}</strong> to confirm you physically have the file and want to exit it.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2 relative group">
              <label className="text-xs font-bold uppercase tracking-widest text-white/50">Scanner Input</label>
              <Input
                autoFocus
                value={exitModalScanInput}
                onChange={(e) => setExitModalScanInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (exitModalScanInput.trim() === exitModalFile?.cfo_diary_number || exitModalScanInput.trim() === exitModalFile?.receiving_number) {
                      handleExitFile(exitModalFile);
                      setExitModalFile(null);
                      setExitModalScanInput("");
                    } else {
                      toast.error("Scanned code does not match the selected file!");
                    }
                  }
                }}
                placeholder="Scan QR here..."
                className="bg-[#111318] border-white/5 text-white placeholder:text-white/20 pl-10 focus:border-[#14b8a6] focus:ring-1 focus:ring-[#14b8a6]"
              />
              <div className="absolute left-3 top-9 text-white/40 group-focus-within:text-[#14b8a6] transition-colors">
                <ScanLine className="w-4 h-4" />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              className="bg-transparent border-white/10 text-white/70 hover:text-white hover:bg-white/5"
              onClick={() => {
                setExitModalFile(null);
                setExitModalScanInput("");
              }}
            >
              Cancel
            </Button>
            <Button
              className="bg-[#14b8a6] hover:bg-[#0d9488] text-black font-bold"
              onClick={() => {
                if (exitModalScanInput.trim() === exitModalFile?.cfo_diary_number || exitModalScanInput.trim() === exitModalFile?.receiving_number) {
                  handleExitFile(exitModalFile);
                  setExitModalFile(null);
                  setExitModalScanInput("");
                } else {
                  toast.error("Scanned code does not match the selected file!");
                }
              }}
              disabled={!exitModalScanInput}
            >
              Confirm Exit
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}


