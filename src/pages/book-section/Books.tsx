import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Search, Plus, Filter, FileSpreadsheet, Library, Bookmark, Calendar, Trash2, Edit, Printer } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface RegisterRecord {
  id: string;
  bookName: string;
  type: 'cash_book' | 'ledger' | 'stock' | 'bill_book';
  volumeNo: string;
  financialYear: string;
  totalEntries: number;
  lastUpdated: string;
  status: 'active' | 'completed' | 'archived';
}

export default function Books() {
  const [records, setRecords] = useState<RegisterRecord[]>([
    { id: '1', bookName: 'Main Cash Book - Head Office', type: 'cash_book', volumeNo: 'Vol-42', financialYear: '2023-24', totalEntries: 450, lastUpdated: '2024-03-15', status: 'active' },
    { id: '2', bookName: 'Contractor Ledger - North', type: 'ledger', volumeNo: 'L-12', financialYear: '2023-24', totalEntries: 120, lastUpdated: '2024-02-28', status: 'active' },
    { id: '3', bookName: 'Stationery Stock Register', type: 'stock', volumeNo: 'S-05', financialYear: '2022-23', totalEntries: 890, lastUpdated: '2023-06-30', status: 'completed' },
  ]);

  const [searchQuery, setSearchQuery] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [newBook, setNewBook] = useState<Partial<RegisterRecord>>({
    type: 'cash_book',
    status: 'active',
    financialYear: '2024-25'
  });

  const handleAdd = () => {
    if (!newBook.bookName || !newBook.volumeNo) {
      toast.error("Please fill required fields (Book Name and Volume No)");
      return;
    }
    const record: RegisterRecord = {
      ...(newBook as RegisterRecord),
      id: Math.random().toString(36).substr(2, 9),
      totalEntries: 0,
      lastUpdated: new Date().toISOString().split('T')[0]
    };
    setRecords([record, ...records]);
    setIsAdding(false);
    setNewBook({ type: 'cash_book', status: 'active', financialYear: '2024-25' });
    toast.success("New Register added to central record!");
  };

  const filteredRecords = records.filter(r => 
    r.bookName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    r.volumeNo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase text-zinc-100 flex items-center gap-3">
            <Library className="w-8 h-8 text-primary" />
            Financial Books & Registers
          </h1>
          <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest mt-1">Inventory of Official Ledgers & Cash Books</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2 border-primary/20 hover:bg-primary/5">
            <Printer className="w-4 h-4" /> Print Labels
          </Button>
          <Button className="gap-2 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20" onClick={() => setIsAdding(!isAdding)}>
            {isAdding ? <Bookmark className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {isAdding ? "View Inventory" : "Add New Register"}
          </Button>
        </div>
      </div>

      {/* Categories Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Registers", value: records.length, icon: Library, color: "text-blue-500" },
          { label: "Active Books", value: records.filter(r => r.status === 'active').length, icon: Bookmark, color: "text-emerald-500" },
          { label: "Cash Books", value: records.filter(r => r.type === 'cash_book').length, icon: FileSpreadsheet, color: "text-amber-500" },
          { label: "Ledgers", value: records.filter(r => r.type === 'ledger').length, icon: BookOpen, color: "text-purple-500" },
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
        <Card className="glass-card border-none shadow-2xl animate-in fade-in zoom-in-95 duration-500">
          <CardHeader className="border-b border-white/5 py-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              Register New Financial Book
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2 lg:col-span-2">
                <Label className="text-xs uppercase font-bold text-muted-foreground">Book / Register Name *</Label>
                <Input 
                  placeholder="e.g. Contractor Payment Ledger 2024" 
                  value={newBook.bookName}
                  onChange={e => setNewBook({...newBook, bookName: e.target.value})}
                  className="bg-muted/10 border-border/50" 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase font-bold text-muted-foreground">Volume No *</Label>
                <Input 
                  placeholder="e.g. Vol-XX-01" 
                  value={newBook.volumeNo}
                  onChange={e => setNewBook({...newBook, volumeNo: e.target.value})}
                  className="bg-primary/5 border-primary/20 font-mono" 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase font-bold text-muted-foreground">Register Type</Label>
                <Select value={newBook.type} onValueChange={(v: any) => setNewBook({...newBook, type: v})}>
                  <SelectTrigger className="bg-muted/10 border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash_book">Cash Book</SelectItem>
                    <SelectItem value="ledger">Employee Ledger</SelectItem>
                    <SelectItem value="stock">Stock Register</SelectItem>
                    <SelectItem value="bill_book">Bill Book</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase font-bold text-muted-foreground">Financial Year</Label>
                <Input 
                  placeholder="e.g. 2024-25" 
                  value={newBook.financialYear}
                  onChange={e => setNewBook({...newBook, financialYear: e.target.value})}
                  className="bg-muted/10 border-border/50" 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase font-bold text-muted-foreground">Management Status</Label>
                <Select value={newBook.status} onValueChange={(v: any) => setNewBook({...newBook, status: v})}>
                  <SelectTrigger className="bg-muted/10 border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active (Writing)</SelectItem>
                    <SelectItem value="completed">Completed (Closed)</SelectItem>
                    <SelectItem value="archived">Archived (Record Room)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-8">
              <Button variant="ghost" onClick={() => setIsAdding(false)}>Cancel</Button>
              <Button onClick={handleAdd} className="bg-primary hover:bg-primary/90 px-8">Save Register</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="glass-card border-none shadow-xl overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 py-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="w-5 h-5 text-primary" />
              Books Inventory
            </CardTitle>
            <div className="relative w-64 lg:w-96">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search by book name or volume..." 
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
                  <TableHead className="pl-6">Volume / Ref</TableHead>
                  <TableHead>Register Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>F. Year</TableHead>
                  <TableHead>Entries</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right pr-6">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground italic">
                      No registers found in inventory.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRecords.map((record) => (
                    <TableRow key={record.id} className="hover:bg-primary/5 transition-colors border-b border-white/5">
                      <TableCell className="pl-6 font-mono text-xs font-bold text-primary">{record.volumeNo}</TableCell>
                      <TableCell className="font-bold text-sm tracking-tight">{record.bookName}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[9px] uppercase border-primary/20">
                          {record.type.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-mono">{record.financialYear}</TableCell>
                      <TableCell className="text-xs font-bold text-muted-foreground">{record.totalEntries}</TableCell>
                      <TableCell>
                        <Badge className={`text-[9px] uppercase font-black tracking-widest ${
                          record.status === 'active' ? 'bg-emerald-500/20 text-emerald-500' :
                          record.status === 'completed' ? 'bg-blue-500/20 text-blue-500' :
                          'bg-zinc-500/20 text-zinc-500'
                        }`}>
                          {record.status}
                        </Badge>
                      </TableCell>
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
