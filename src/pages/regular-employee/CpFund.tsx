import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Save, RotateCcw, Printer, FileText } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Utility to convert numbers to words
function numberToWords(num: number): string {
  const a = ['','One ','Two ','Three ','Four ', 'Five ','Six ','Seven ','Eight ','Nine ','Ten ','Eleven ','Twelve ','Thirteen ','Fourteen ','Fifteen ','Sixteen ','Seventeen ','Eighteen ','Nineteen '];
  const b = ['', '', 'Twenty','Thirty','Forty','Fifty', 'Sixty','Seventy','Eighty','Ninety'];

  let numStr = num.toString();
  if (numStr.length > 9) return 'overflow';
  let n = ('000000000' + numStr).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return ''; 
  let str = '';
  str += (n[1] !== '00') ? (a[Number(n[1])] || b[Number(n[1][0])] + ' ' + a[Number(n[1][1])]) + 'Crore ' : '';
  str += (n[2] !== '00') ? (a[Number(n[2])] || b[Number(n[2][0])] + ' ' + a[Number(n[2][1])]) + 'Lakh ' : '';
  str += (n[3] !== '00') ? (a[Number(n[3])] || b[Number(n[3][0])] + ' ' + a[Number(n[3][1])]) + 'Thousand ' : '';
  str += (n[4] !== '0') ? (a[Number(n[4])] || b[Number(n[4][0])] + ' ' + a[Number(n[4][1])]) + 'Hundred ' : '';
  str += (n[5] !== '00') ? ((str !== '') ? 'and ' : '') + (a[Number(n[5])] || b[Number(n[5][0])] + ' ' + a[Number(n[5][1])]) + 'only ' : '';
  return str.trim() || 'Zero';
}

export default function CpFund({ title = "CP Fund" }: { title?: string }) {
  const [formData, setFormData] = useState({
    serialNo: '',
    empNo: '',
    empName: '',
    billPassedOn: '',
    totalAmount: '',
    chequeNo: '',
    chequeAmount: '',
    amountInWords: '',
    balanceAmount: '',
    disbursedOn: '',
    status: 'active'
  });

  const [records, setRecords] = useState<any[]>([]);

  const fetchRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('contractors')
        .select('*')
        .eq('vendor_type', title.toLowerCase().replace(' ', '_'))
        .order('created_at', { ascending: false })
        .limit(10);
        
      if (error) throw error;
      if (data) setRecords(data);
    } catch (err) {
      console.error("Error fetching records:", err);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [title]);

  const handleFetchEmployee = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && formData.empNo) {
      toast.info('Searching database...');
      try {
        const { data, error } = await supabase
          .from('contractors')
          .select('*')
          .eq('party_code', formData.empNo)
          .maybeSingle();
        
        if (data) {
           setFormData(prev => ({
            ...prev,
            empName: data.contractor_name || '',
            totalAmount: data.gross_amount?.toString() || '0',
            balanceAmount: data.balance_amount?.toString() || '0',
            billPassedOn: data.bill_passed_on || ''
          }));
          toast.success('Record found');
        } else {
           toast.error('Record not found in Supabase');
        }
      } catch (err) {
         toast.error('Failed to fetch from Database');
      }
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const num = parseInt(val, 10);
    setFormData(prev => ({
      ...prev,
      chequeAmount: val,
      amountInWords: val && !isNaN(num) ? numberToWords(num) : ''
    }));
  };

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!formData.empName) {
      toast.error('Employee Name is required');
      return;
    }
    
    setIsSaving(true);
    try {
      const { error } = await supabase.from('contractors').insert({
        contractor_name: formData.empName,
        party_code: formData.empNo,
        cheque_no: formData.chequeNo,
        gross_amount: parseFloat(formData.totalAmount) || 0,
        balance_amount: parseFloat(formData.balanceAmount) || 0,
        net_amount: parseFloat(formData.chequeAmount) || 0,
        bill_passed_on: formData.billPassedOn || null,
        payment_date: formData.disbursedOn || null,
        vendor_type: title.toLowerCase().replace(' ', '_'),
        voucher_no: formData.serialNo !== 'Auto-Gen' ? formData.serialNo : null
      });

      if (error) throw error;
      
      toast.success(`${title} details saved successfully to database!`);
      setFormData({
        serialNo: '',
        empNo: '',
        empName: '',
        billPassedOn: '',
        totalAmount: '',
        chequeNo: '',
        chequeAmount: '',
        amountInWords: '',
        balanceAmount: '',
        disbursedOn: '',
        status: 'active'
      });
      fetchRecords(); // Refresh table
    } catch (err: any) {
      toast.error('Failed to save to database: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{title} (Regular Employee)</h1>
          <p className="text-sm text-muted-foreground">Manage employee cheque details and amounts for {title}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <RotateCcw className="w-4 h-4" /> Reset
          </Button>
          <Button size="sm" className="gap-2 bg-primary hover:bg-primary/90" onClick={handleSave} disabled={isSaving}>
            <Save className="w-4 h-4" /> {isSaving ? 'Saving...' : 'Save Record'}
          </Button>
          <Button variant="secondary" size="sm" className="gap-2" onClick={() => toast.success('Report generated')}>
            <Printer className="w-4 h-4" /> Generate Report
          </Button>
        </div>
      </div>

      <Card className="glass-card overflow-hidden border-none shadow-md">
        <div className="h-2 bg-primary" />
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Cheque Details Entry
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="serialNo">Serial No</Label>
              <Input 
                id="serialNo" 
                placeholder="Auto-gen" 
                className="bg-muted/30 h-9" 
                value={formData.serialNo}
                onChange={e => setFormData({...formData, serialNo: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="empNo">Employee No (Press Enter)</Label>
              <Input 
                id="empNo" 
                placeholder="EMP-XXXX" 
                className="bg-muted/20 h-9 border-primary/50" 
                value={formData.empNo}
                onChange={e => setFormData({...formData, empNo: e.target.value})}
                onKeyDown={handleFetchEmployee}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="empName">Employee Name</Label>
              <Input 
                id="empName" 
                placeholder="Auto filled" 
                className="bg-muted/20 h-9" 
                value={formData.empName}
                readOnly
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="billPassedOn">Bill Passed On</Label>
              <Input 
                id="billPassedOn" 
                type="date" 
                className="bg-muted/20 h-9" 
                value={formData.billPassedOn}
                onChange={e => setFormData({...formData, billPassedOn: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="totalAmount">Total Amount</Label>
              <Input 
                id="totalAmount" 
                type="number" 
                className="bg-muted/20 h-9 font-mono" 
                value={formData.totalAmount}
                readOnly
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="balanceAmount">Balance Amount</Label>
              <Input 
                id="balanceAmount" 
                type="number" 
                className="bg-muted/20 h-9 font-mono text-rose-500" 
                value={formData.balanceAmount}
                readOnly
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="space-y-2">
              <Label htmlFor="chequeNo">Cheque No</Label>
              <Input 
                id="chequeNo" 
                className="bg-muted/20 h-9" 
                value={formData.chequeNo}
                onChange={e => setFormData({...formData, chequeNo: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="chequeAmount" className="text-primary font-bold">Cheque Amount (Updates Words)</Label>
              <Input 
                id="chequeAmount" 
                type="number" 
                className="bg-primary/10 h-9 font-mono border-primary/50" 
                value={formData.chequeAmount}
                onChange={handleAmountChange}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amountInWords">Amount in Words</Label>
            <Input 
              id="amountInWords" 
              className="bg-muted/30 h-9 italic" 
              value={formData.amountInWords}
              readOnly
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="disbursedOn">Disbursed On</Label>
              <Input 
                id="disbursedOn" 
                type="date" 
                className="bg-muted/20 h-9" 
                value={formData.disbursedOn}
                onChange={e => setFormData({...formData, disbursedOn: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={val => setFormData({...formData, status: val})}>
                <SelectTrigger className="bg-muted/20 h-9">
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="cleared">Cleared</SelectItem>
                  <SelectItem value="returned">Returned</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid List Bottom */}
      <Card className="glass-card overflow-hidden border-none shadow-md mt-6">
        <div className="h-2 bg-indigo-500/50" />
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            Recent {title} Entries
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border/50 overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Serial</TableHead>
                  <TableHead>Emp/Party Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Cheque No</TableHead>
                  <TableHead>Disbursed Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.length > 0 ? (
                  records.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.voucher_no || 'N/A'}</TableCell>
                      <TableCell>{r.party_code}</TableCell>
                      <TableCell>{r.contractor_name}</TableCell>
                      <TableCell>{r.cheque_no}</TableCell>
                      <TableCell>{r.net_amount}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">No records found for {title}</TableCell>
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
