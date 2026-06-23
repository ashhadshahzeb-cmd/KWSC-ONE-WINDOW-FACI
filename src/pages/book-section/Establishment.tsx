import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, UserPlus, Building2, Calendar, FileText, Download, Filter, Trash2, Edit } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface StaffRecord {
  id: string;
  name: string;
  designation: string;
  department: string;
  status: 'active' | 'retired' | 'suspended' | 'on_leave';
  joiningDate: string;
  empId: string;
}

export default function Establishment() {
  const [records, setRecords] = useState<StaffRecord[]>([
    { id: '1', name: 'Ahmed Ali', designation: 'Assistant Director', department: 'Finance', status: 'active', joiningDate: '2015-06-12', empId: 'KW-10293' },
    { id: '2', name: 'Sara Khan', designation: 'Senior Accountant', department: 'Accounts', status: 'active', joiningDate: '2018-02-20', empId: 'KW-10442' },
    { id: '3', name: 'Zamir Ahmed', designation: 'Superintendent', department: 'Establishment', status: 'retired', joiningDate: '1985-01-10', empId: 'KW-00921' },
  ]);

  const [searchQuery, setSearchQuery] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [newRecord, setNewRecord] = useState<Partial<StaffRecord>>({
    status: 'active',
    department: 'Finance'
  });

  const handleAdd = () => {
    if (!newRecord.name || !newRecord.empId) {
      toast.error("Please fill required fields (Name and Employee ID)");
      return;
    }
    const record: StaffRecord = {
      ...(newRecord as StaffRecord),
      id: Math.random().toString(36).substr(2, 9),
      joiningDate: newRecord.joiningDate || new Date().toISOString().split('T')[0]
    };
    setRecords([record, ...records]);
    setIsAdding(false);
    setNewRecord({ status: 'active', department: 'Finance' });
    toast.success("New dossier registered successfully!");
  };

  const filteredRecords = records.filter(r => 
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    r.empId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase text-zinc-100 flex items-center gap-3">
            <Building2 className="w-8 h-8 text-primary" />
            Establishment Section
          </h1>
          <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest mt-1">Personnel & Service Records Management</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2 border-primary/20 hover:bg-primary/5">
            <Download className="w-4 h-4" /> Export Roster
          </Button>
          <Button className="gap-2 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20" onClick={() => setIsAdding(!isAdding)}>
            {isAdding ? <FileText className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            {isAdding ? "View Roster" : "Register New Dossier"}
          </Button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Staff", value: records.length, icon: Building2, color: "text-blue-500" },
          { label: "Active Duty", value: records.filter(r => r.status === 'active').length, icon: Calendar, color: "text-emerald-500" },
          { label: "Retired / Pension", value: records.filter(r => r.status === 'retired').length, icon: FileText, color: "text-amber-500" },
          { label: "System Sync", value: "Online", icon: Search, color: "text-purple-500" },
        ].map((stat, i) => (
          <Card key={i} className="glass-card border-none overflow-hidden relative group">
            <div className={`absolute top-0 right-0 w-16 h-16 opacity-10 group-hover:opacity-20 transition-opacity ${stat.color}`}>
              <stat.icon className="w-full h-full p-2" />
            </div>
            <CardContent className="p-6">
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{stat.label}</p>
              <h3 className="text-2xl font-black mt-1 text-zinc-100">{stat.value}</h3>
            </CardContent>
          </Card>
        ))}
      </div>

      {isAdding ? (
        <Card className="glass-card border-none shadow-2xl animate-in slide-in-from-bottom-4 duration-500">
          <CardHeader className="border-b border-white/5 py-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" />
              Register New Dossier
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label className="text-xs uppercase font-bold text-muted-foreground">Full Name *</Label>
                <Input 
                  placeholder="Enter employee name" 
                  value={newRecord.name}
                  onChange={e => setNewRecord({...newRecord, name: e.target.value})}
                  className="bg-muted/10 border-border/50" 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase font-bold text-muted-foreground">Employee ID / Code *</Label>
                <Input 
                  placeholder="e.g. KW-12345" 
                  value={newRecord.empId}
                  onChange={e => setNewRecord({...newRecord, empId: e.target.value})}
                  className="bg-primary/5 border-primary/20 font-mono" 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase font-bold text-muted-foreground">Designation</Label>
                <Input 
                  placeholder="e.g. Superintendent" 
                  value={newRecord.designation}
                  onChange={e => setNewRecord({...newRecord, designation: e.target.value})}
                  className="bg-muted/10 border-border/50" 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase font-bold text-muted-foreground">Department</Label>
                <Select value={newRecord.department} onValueChange={v => setNewRecord({...newRecord, department: v})}>
                  <SelectTrigger className="bg-muted/10 border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Finance">Finance</SelectItem>
                    <SelectItem value="Accounts">Accounts</SelectItem>
                    <SelectItem value="Establishment">Establishment</SelectItem>
                    <SelectItem value="IT">IT Department</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase font-bold text-muted-foreground">Service Status</Label>
                <Select value={newRecord.status} onValueChange={(v: any) => setNewRecord({...newRecord, status: v})}>
                  <SelectTrigger className="bg-muted/10 border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active Service</SelectItem>
                    <SelectItem value="retired">Retired / Pension</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="on_leave">On Leave</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase font-bold text-muted-foreground">Date of Joining</Label>
                <Input 
                  type="date" 
                  value={newRecord.joiningDate}
                  onChange={e => setNewRecord({...newRecord, joiningDate: e.target.value})}
                  className="bg-muted/10 border-border/50" 
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-8">
              <Button variant="ghost" onClick={() => setIsAdding(false)}>Cancel</Button>
              <Button onClick={handleAdd} className="bg-primary hover:bg-primary/90 px-8">Save Record</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="glass-card border-none shadow-xl overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 py-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="w-5 h-5 text-primary" />
              Staff Roster & Dossiers
            </CardTitle>
            <div className="relative w-64 lg:w-96">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search by name or ID..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10 bg-muted/20 border-border/50 text-sm h-9" 
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/50 uppercase text-[10px] font-black tracking-tighter">
                <TableRow>
                  <TableHead className="pl-6">Employee ID</TableHead>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right pr-6">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground italic">
                      No records found matching your search.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRecords.map((record) => (
                    <TableRow key={record.id} className="hover:bg-primary/5 transition-colors border-b border-white/5">
                      <TableCell className="pl-6 font-mono text-xs font-bold text-primary">{record.empId}</TableCell>
                      <TableCell className="font-bold text-sm tracking-tight">{record.name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{record.designation}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[9px] uppercase border-primary/20">{record.department}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-[9px] uppercase font-black tracking-widest ${
                          record.status === 'active' ? 'bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/30' :
                          record.status === 'retired' ? 'bg-amber-500/20 text-amber-500 hover:bg-amber-500/30' :
                          'bg-zinc-500/20 text-zinc-500 hover:bg-zinc-500/30'
                        }`}>
                          {record.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">{record.joiningDate}</TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-primary"><Edit className="w-3.5 h-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
