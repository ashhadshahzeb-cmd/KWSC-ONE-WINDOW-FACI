import React, { useState, useEffect } from 'react';
import { getDepartmentUsers, saveDepartmentUsers, DepartmentUser } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Save, UserPlus, Eye, EyeOff, ShieldAlert, Edit2, Check, X, Shield, Trash2, Search as SearchIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

const AVAILABLE_ROLES = [
  { id: 'admin', label: 'System Administrator (Full Access)' },
  { id: 'cfo', label: 'CFO (Full Tracking Access)' },
  { id: 'cia', label: 'CIA' },
  { id: 'budget', label: 'Budget Section' },
  { id: 'pension', label: 'Pension Section' },
  { id: 'fund', label: 'Fund Section' },
  { id: 'internal_audit_1', label: 'Internal Audit 1' },
  { id: 'director_account', label: 'Director Account' },
  { id: 'director_finance', label: 'Director Finance' },
  { id: 'director_it', label: 'Director IT' },
  { id: 'sub_cfo', label: 'Asst. CFO' },
  { id: 'sub_cfo_1', label: 'Asst. CFO 1 (Restricted)' },
  { id: 'sub_cfo_2', label: 'Asst. CFO 2 (Restricted)' },
  { id: 'sub_cfo_3', label: 'Asst. CFO 3 (Restricted)' },
  { id: 'sub_cfo_4', label: 'Asst. CFO 4 (Restricted)' },
  { id: 'books', label: 'Books Section' },
  { id: 'establishment', label: 'Establishment Section' },
  { id: 'director_audit', label: 'Director Audit' },
  { id: 'internal_audit_2', label: 'Internal Audit 2' },
  { id: 'law_department', label: 'Law Department' },
  { id: 'chro', label: 'CHRO' },
  { id: 'md_office', label: 'MD Office' },
  { id: 'emp_operator', label: 'Employee Operator (Details Only)' },
];

export default function UserManagement() {
  const [users, setUsers] = useState<DepartmentUser[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<DepartmentUser | null>(null);
  const [showPasswords, setShowPasswords] = useState<Record<number, boolean>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    setUsers(getDepartmentUsers());
  }, []);

  const handleSave = () => {
    saveDepartmentUsers(users);
    toast.success('User configuration saved successfully!');
  };

  const togglePasswordVisibility = (index: number) => {
    setShowPasswords(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const startEdit = (index: number, user: DepartmentUser) => {
    setEditingIndex(index);
    setEditForm({ ...user });
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditForm(null);
  };

  const confirmEdit = () => {
    if (editingIndex !== null && editForm) {
      const updatedUsers = [...users];
      updatedUsers[editingIndex] = editForm;
      setUsers(updatedUsers);
      setEditingIndex(null);
      setEditForm(null);
      toast.info('Changes applied locally. Click "Save Configuration" to persist.');
    }
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (editForm) {
      setUsers([...users, editForm]);
      setIsAddModalOpen(false);
      setEditForm(null);
      toast.info('New user added locally. Click "Save Configuration" to persist.');
    }
  };

  const handleDelete = (index: number) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      const updatedUsers = users.filter((_, i) => i !== index);
      setUsers(updatedUsers);
      toast.info('User removed locally. Click "Save Configuration" to persist.');
    }
  };

  const filteredUsers = users.filter(u => 
    u.displayName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.roleId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ShieldAlert className="w-8 h-8 text-primary" />
            User & Permission Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage local department users, view passwords, and assign roles.
          </p>
        </div>
        <div className="flex gap-3">
          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditForm({ email: '', password: '', roleId: '', displayName: '' })} variant="outline" className="bg-card hover:bg-muted text-foreground">
                <UserPlus className="w-4 h-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-card text-foreground">
              <DialogHeader>
                <DialogTitle>Add New Department User</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddUser} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Display Name</Label>
                  <Input 
                    placeholder="e.g. SYSTEM ADMINISTRATOR" 
                    value={editForm?.displayName || ''} 
                    onChange={e => setEditForm(prev => prev ? {...prev, displayName: e.target.value.toUpperCase()} : null)} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input 
                    type="email" 
                    placeholder="e.g. user@kwsb.gov.pk" 
                    value={editForm?.email || ''} 
                    onChange={e => setEditForm(prev => prev ? {...prev, email: e.target.value.toLowerCase()} : null)} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input 
                    placeholder="Enter password" 
                    value={editForm?.password || ''} 
                    onChange={e => setEditForm(prev => prev ? {...prev, password: e.target.value} : null)} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Role / Permission</Label>
                  <Select 
                    value={editForm?.roleId || ''} 
                    onValueChange={(val) => setEditForm(prev => prev ? {...prev, roleId: val} : null)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      {AVAILABLE_ROLES.map(role => (
                        <SelectItem key={role.id} value={role.id}>
                          <span className="font-medium">{role.id}</span> - <span className="text-muted-foreground text-xs">{role.label}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter className="pt-4">
                  <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">Create User</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Button onClick={handleSave} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20">
            <Save className="w-4 h-4 mr-2" />
            Save Configuration
          </Button>
        </div>
      </div>

      <Card className="border-border shadow-sm overflow-hidden bg-card">
        <CardHeader className="bg-muted/50 border-b border-border pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <CardTitle className="text-lg font-semibold text-foreground">Department Accounts</CardTitle>
            <div className="relative w-full sm:w-72">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search users..." 
                className="pl-9 bg-background border-border text-foreground"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="border-border">
                  <TableHead className="font-semibold text-foreground w-[25%]">Display Name</TableHead>
                  <TableHead className="font-semibold text-foreground w-[25%]">Email Account</TableHead>
                  <TableHead className="font-semibold text-foreground w-[20%]">Role / Permission</TableHead>
                  <TableHead className="font-semibold text-foreground w-[20%]">Password</TableHead>
                  <TableHead className="text-right font-semibold text-foreground w-[10%]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user, idx) => {
                  const originalIndex = users.findIndex(u => u.email === user.email);
                  const isEditing = editingIndex === originalIndex;

                  return (
                    <TableRow key={originalIndex} className="hover:bg-muted/30 border-border transition-colors">
                      <TableCell className="font-medium text-foreground">
                        {isEditing ? (
                          <Input 
                            value={editForm?.displayName || ''} 
                            onChange={e => setEditForm(prev => prev ? {...prev, displayName: e.target.value} : null)}
                            className="h-9 text-sm bg-background border-border"
                          />
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs border border-primary/30">
                              {user.displayName.substring(0, 2)}
                            </div>
                            {user.displayName}
                          </div>
                        )}
                      </TableCell>
                      
                      <TableCell className="text-muted-foreground">
                        {isEditing ? (
                          <Input 
                            value={editForm?.email || ''} 
                            onChange={e => setEditForm(prev => prev ? {...prev, email: e.target.value} : null)}
                            className="h-9 text-sm bg-background border-border"
                          />
                        ) : (
                          user.email
                        )}
                      </TableCell>

                      <TableCell>
                        {isEditing ? (
                          <Select 
                            value={editForm?.roleId || ''} 
                            onValueChange={(val) => setEditForm(prev => prev ? {...prev, roleId: val} : null)}
                          >
                            <SelectTrigger className="h-9 bg-background border-border">
                              <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                            <SelectContent>
                              {AVAILABLE_ROLES.map(role => (
                                <SelectItem key={role.id} value={role.id}>
                                  {role.id}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                            <Shield className="w-3 h-3 mr-1" />
                            {user.roleId}
                          </span>
                        )}
                      </TableCell>

                      <TableCell>
                        {isEditing ? (
                          <Input 
                            value={editForm?.password || ''} 
                            onChange={e => setEditForm(prev => prev ? {...prev, password: e.target.value} : null)}
                            className="h-9 text-sm bg-background border-border"
                          />
                        ) : (
                          <div className="flex items-center justify-between bg-muted/50 rounded-md px-3 py-1.5 border border-border">
                            <span className="text-sm font-mono text-muted-foreground select-all tracking-wider">
                              {showPasswords[originalIndex] ? user.password : '••••••••'}
                            </span>
                            <button 
                              onClick={() => togglePasswordVisibility(originalIndex)}
                              className="text-muted-foreground hover:text-primary transition-colors ml-2"
                              title={showPasswords[originalIndex] ? "Hide Password" : "Show Password"}
                            >
                              {showPasswords[originalIndex] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        )}
                      </TableCell>

                      <TableCell className="text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-1">
                            <Button size="icon" variant="ghost" onClick={confirmEdit} className="h-8 w-8 text-green-500 hover:text-green-600 hover:bg-green-500/10">
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={cancelEdit} className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10">
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1">
                            <Button size="icon" variant="ghost" onClick={() => startEdit(originalIndex, user)} className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10">
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => handleDelete(originalIndex)} className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-500/10">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      No users found matching "{searchTerm}"
                    </TableCell>
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
