import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileCheck,
  History,
  Calendar,
  User,
  Building2,
  ArrowLeft,
  CheckCircle2,
  Clock,
  ShieldCheck,
  QrCode
} from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function PublicTracking() {
  const { diaryNo, receivingNo } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [record, setRecord] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [isUnlocked, setIsUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "1234") {
      setIsUnlocked(true);
    } else {
      setErrorMsg("Incorrect password");
    }
  };

  useEffect(() => {
    const fetchRecord = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('file_tracking_records' as any)
          .select('*')
          .or(`cfo_diary_number.eq.${diaryNo},receiving_number.eq.${receivingNo}`)
          .maybeSingle();

        if (data) {
          setRecord({
            cfo_diary_number: data.cfo_diary_number,
            receiving_number: data.receiving_number,
            subject: data.subject,
            mainCategory: data.main_category,
            subCategory: data.sub_category,
            status: "In-Progress",
            amount: data.amount || 0,
            forward_to: data.mark_to,
            history: data.history || []
          });
        } else {
          // Fallback mockup if no record found (for local dev testing without DB)
          setRecord({
            cfo_diary_number: diaryNo,
            receiving_number: receivingNo,
            subject: "Sample File Tracking Record (Record Not Found in DB)",
            mainCategory: "employee",
            subCategory: "medical_case",
            status: "Unknown",
            forward_to: searchParams.get('sec') || "PROCESSING",
            history: []
          });
        }
        setLoading(false);
      } catch (err) {
        setLoading(false);
      }
    };
    fetchRecord();
  }, [diaryNo, receivingNo]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest">Verifying Record...</p>
        </div>
      </div>
    );
  }

  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
        <Card className="w-full max-w-sm rounded-[30px] border-none shadow-2xl overflow-hidden">
          <div className="p-1 bg-gradient-to-r from-emerald-500 to-primary"></div>
          <CardContent className="pt-8 pb-8 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-black text-zinc-800 uppercase tracking-tight">Protected Record</h2>
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Enter password to view</p>
            </div>
            
            <form onSubmit={handleUnlock} className="space-y-4">
              <div className="space-y-2">
                <input
                  type="password"
                  placeholder="Enter Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-12 bg-zinc-100 border-none rounded-xl px-4 text-center font-bold tracking-widest text-zinc-800 focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                {errorMsg && <p className="text-[10px] text-red-500 font-bold uppercase text-center">{errorMsg}</p>}
              </div>
              <Button type="submit" className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl uppercase tracking-widest text-xs">
                Unlock Record
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-10">
      {/* Mobile-First Header */}
      <div className="bg-primary px-6 pt-12 pb-20 rounded-b-[40px] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full -ml-10 -mb-10 blur-2xl"></div>

        <div className="relative flex justify-between items-center mb-6">
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shadow-[0_0_12px_rgba(255,255,255,0.15)]">
            <span className="text-[9px] font-black text-white tracking-widest leading-none text-center">KW<br/>SC</span>
          </div>
        </div>

        <div className="relative text-center space-y-2">
          <h1 className="text-white text-2xl font-black tracking-tighter uppercase">Verified Record</h1>
          <p className="text-primary-foreground/70 text-xs font-bold uppercase tracking-widest">Karachi Water Corporation</p>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="px-6 -mt-12 relative">
        <Card className="rounded-[30px] border-none shadow-xl overflow-hidden">
          <div className="p-1 bg-gradient-to-r from-emerald-500 to-primary"></div>
          <CardContent className="pt-8 space-y-8">
            {/* Status Badge */}
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 border-4 border-emerald-500/5">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="text-center">
                <h2 className="text-xl font-black text-zinc-800 uppercase tracking-tight">Active Status</h2>
                <Badge className="bg-emerald-500 hover:bg-emerald-600 font-bold px-4 py-1 rounded-full uppercase text-[10px]">
                  In-Process / Verified
                </Badge>
              </div>
            </div>

            {/* Tracking Numbers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-3xl p-6 text-center border-2 border-primary/10 shadow-sm relative group overflow-hidden">
                <div className="absolute top-0 right-0 w-12 h-12 bg-primary/5 rounded-bl-3xl"></div>
                <span className="text-[10px] font-black text-primary/40 uppercase tracking-[0.2em]">CFO Diary No</span>
                <p className="text-lg font-black text-zinc-800 font-mono mt-2 tracking-tighter">{record?.cfo_diary_number || "---"}</p>
              </div>
              <div className="bg-white rounded-3xl p-6 text-center border-2 border-emerald-500/10 shadow-sm relative group overflow-hidden">
                <div className="absolute top-0 right-0 w-12 h-12 bg-emerald-500/5 rounded-bl-3xl"></div>
                <span className="text-[10px] font-black text-emerald-500/40 uppercase tracking-[0.2em]">Receiving No</span>
                <p className="text-lg font-black text-zinc-800 font-mono mt-2 tracking-tighter">{record?.receiving_number || "---"}</p>
              </div>
            </div>

            {/* File Info */}
            <div className="space-y-4 pt-4 border-t border-zinc-100">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase">Subject</span>
                  <p className="text-sm font-bold text-zinc-800 leading-tight">{record?.subject}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase">Current Section</span>
                  <p className="text-sm font-black text-blue-600 uppercase tracking-tight">{record?.forward_to}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase">Net Amount</span>
                  <p className="text-sm font-black text-emerald-600 tracking-tight">PKR {record?.amount?.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="space-y-6 pt-6 border-t border-zinc-100">
              <h3 className="text-xs font-black uppercase text-zinc-400 tracking-widest flex items-center gap-2">
                <History className="w-4 h-4" /> Movement History
              </h3>

              <div className="space-y-6 ml-2 border-l-2 border-zinc-100 pl-6">
                {record?.history.map((step: any, i: number) => (
                  <div key={i} className="relative">
                    <div className="absolute -left-[31px] top-1 w-2.5 h-2.5 rounded-full bg-primary border-2 border-white"></div>
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-[10px] font-black text-primary uppercase">{step.processed_by}</span>
                      <span className="text-[9px] font-bold text-zinc-400">{new Date(step.date).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs text-zinc-500 font-medium italic">"{step.remarks}"</p>
                  </div>
                ))}
              </div>
            </div>

            {/* QR Section */}
            <div className="mt-8 p-6 bg-zinc-950 rounded-[30px] flex flex-col items-center gap-4 text-center">
              <div className="bg-white p-3 rounded-2xl shadow-xl shadow-primary/20 flex flex-col items-center">
                <div className="w-20 h-20">
                  <QrCode className="w-full h-full text-zinc-900" />
                </div>
                <span className="text-[8px] font-bold mt-2 text-zinc-600 uppercase text-center">Prepared by<br />Engineer Tariq Zamir</span>
              </div>
              <div>
                <p className="text-white text-sm font-black">Digital Authentication</p>
                <p className="text-zinc-500 text-[10px] font-bold uppercase mt-1">Scan to verify this document</p>
              </div>
            </div>

          </CardContent>
          <div className="bg-zinc-100 p-4 text-center">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">© 2026 KWC Finance Department</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
