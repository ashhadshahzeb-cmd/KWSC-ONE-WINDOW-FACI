import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Plus, Trash2, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function PolBillsSettings() {
  const [fields, setFields] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // New Field State
  const [fieldName, setFieldName] = useState("");
  const [fieldType, setFieldType] = useState("text");
  const [isRequired, setIsRequired] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchFields();
  }, []);

  const fetchFields = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('pol_bills_custom_fields' as any)
        .select('*')
        .order('created_at', { ascending: true });
        
      if (error) throw error;
      setFields(data || []);
    } catch (err: any) {
      toast.error("Error fetching fields: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddField = async () => {
    if (!fieldName.trim()) {
      toast.error("Field name is required");
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('pol_bills_custom_fields' as any)
        .insert([{
          field_name: fieldName.trim(),
          field_type: fieldType,
          is_required: isRequired
        }]);

      if (error) throw error;
      
      toast.success("Field added successfully!");
      setFieldName("");
      setFieldType("text");
      setIsRequired(false);
      fetchFields();
    } catch (err: any) {
      toast.error("Error adding field: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteField = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this field? This will not delete existing data, but the field will no longer appear on the form.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from('pol_bills_custom_fields' as any)
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success("Field deleted successfully");
      fetchFields();
    } catch (err: any) {
      toast.error("Error deleting field: " + err.message);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20 pt-4">
      <div className="flex items-center justify-between border-b border-border/10 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">POL Bills Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage dynamic custom fields for the POL Bills form</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="glass-card md:col-span-1 shadow-lg h-fit">
          <div className="h-2 bg-primary" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Plus className="w-5 h-5 text-primary" />
              Add New Field
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Field Name</Label>
              <Input 
                placeholder="e.g. Approval Date" 
                value={fieldName} 
                onChange={(e) => setFieldName(e.target.value)} 
                className="bg-muted/20"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Field Type</Label>
              <Select value={fieldType} onValueChange={setFieldType}>
                <SelectTrigger className="bg-muted/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text (Short answer)</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border/50 p-3 bg-muted/10 mt-4">
              <div className="space-y-0.5">
                <Label className="text-sm font-bold">Required Field</Label>
                <p className="text-xs text-muted-foreground">User must fill this to save</p>
              </div>
              <Switch checked={isRequired} onCheckedChange={setIsRequired} />
            </div>

            <Button 
              className="w-full mt-4 bg-primary text-primary-foreground hover:bg-primary/90" 
              onClick={handleAddField}
              disabled={isSaving}
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Create Field
            </Button>
          </CardContent>
        </Card>

        <Card className="glass-card md:col-span-2 shadow-lg">
          <div className="h-2 bg-blue-500/50" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Settings className="w-5 h-5 text-blue-500" />
              Active Custom Fields
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center py-10">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : fields.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground italic border border-dashed border-border/50 rounded-lg">
                No custom fields configured yet.
              </div>
            ) : (
              <div className="rounded-md border border-border/50 overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>Field Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Required</TableHead>
                      <TableHead className="w-[100px] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.map((field) => (
                      <TableRow key={field.id}>
                        <TableCell className="font-semibold">{field.field_name}</TableCell>
                        <TableCell className="uppercase text-xs font-mono">{field.field_type}</TableCell>
                        <TableCell>
                          {field.is_required ? (
                            <span className="bg-red-500/10 text-red-500 text-[10px] px-2 py-0.5 rounded uppercase font-bold border border-red-500/20">Yes</span>
                          ) : (
                            <span className="text-[10px] text-muted-foreground uppercase">No</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-500 hover:text-red-600 hover:bg-red-500/10 h-8 w-8 p-0"
                            onClick={() => handleDeleteField(field.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
