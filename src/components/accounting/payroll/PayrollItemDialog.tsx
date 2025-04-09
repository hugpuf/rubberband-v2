
import { useState, useEffect } from "react";
import { useAccounting } from "@/modules/accounting";
import { useToast } from "@/hooks/use-toast";
import { PayrollRun, PayrollItem, CreatePayrollItemParams } from "@/modules/accounting/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface PayrollItemDialogProps {
  payrollRun: PayrollRun;
  payrollItem?: PayrollItem | null;
  onClose: (updated: boolean) => void;
}

interface Employee {
  id: string;
  name: string;
}

export function PayrollItemDialog({ payrollRun, payrollItem, onClose }: PayrollItemDialogProps) {
  const { createPayrollItem, updatePayrollItem } = useAccounting();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  
  // Form state
  const [employeeId, setEmployeeId] = useState(payrollItem?.employeeId || '');
  const [grossSalary, setGrossSalary] = useState(payrollItem?.grossSalary?.toString() || '0');
  const [regularHours, setRegularHours] = useState(payrollItem?.regularHours?.toString() || '');
  const [overtimeHours, setOvertimeHours] = useState(payrollItem?.overtimeHours?.toString() || '');
  const [hourlyRate, setHourlyRate] = useState(payrollItem?.hourlyRate?.toString() || '');
  const [deductionAmount, setDeductionAmount] = useState(payrollItem?.deductionAmount?.toString() || '0');
  const [notes, setNotes] = useState(payrollItem?.notes || '');
  
  const isEdit = !!payrollItem;
  
  // Fetch available employees
  useEffect(() => {
    const fetchEmployees = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('contacts')
          .select('id, name')
          .eq('type', 'employee')
          .order('name');
          
        if (error) {
          throw error;
        }
        
        setEmployees(data || []);
      } catch (error) {
        console.error("Error fetching employees:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch employees."
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchEmployees();
  }, []);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!employeeId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select an employee."
      });
      return;
    }
    
    setSaving(true);
    
    try {
      const formData: CreatePayrollItemParams = {
        payrollRunId: payrollRun.id,
        employeeId,
        employeeName: employees.find(e => e.id === employeeId)?.name || '',
        grossSalary: parseFloat(grossSalary) || 0,
        regularHours: regularHours ? parseFloat(regularHours) : undefined,
        overtimeHours: overtimeHours ? parseFloat(overtimeHours) : undefined,
        hourlyRate: hourlyRate ? parseFloat(hourlyRate) : undefined,
        taxAmount: 0, // Will be calculated by the service
        deductions: [],
        benefits: [],
        deductionAmount: parseFloat(deductionAmount) || 0,
        netSalary: 0, // Will be calculated by the service
        notes,
        status: 'pending'
      };
      
      if (isEdit && payrollItem) {
        await updatePayrollItem(payrollItem.id, formData);
        toast({
          title: "Payroll item updated",
          description: "The employee payroll information has been updated."
        });
      } else {
        await createPayrollItem(formData);
        toast({
          title: "Employee added",
          description: "The employee has been added to the payroll run."
        });
      }
      
      onClose(true);
    } catch (error) {
      console.error("Error saving payroll item:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: isEdit ? "Failed to update payroll item." : "Failed to add employee to payroll run."
      });
    } finally {
      setSaving(false);
    }
  };
  
  // Calculate gross salary when hours and rate change
  useEffect(() => {
    if (regularHours && hourlyRate) {
      const regular = parseFloat(regularHours) || 0;
      const overtime = parseFloat(overtimeHours) || 0;
      const rate = parseFloat(hourlyRate) || 0;
      
      // Regular hours at normal rate, overtime at 1.5x
      const gross = (regular * rate) + (overtime * rate * 1.5);
      setGrossSalary(gross.toFixed(2));
    }
  }, [regularHours, overtimeHours, hourlyRate]);
  
  return (
    <DialogContent className="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle>{isEdit ? 'Edit Payroll Item' : 'Add Employee to Payroll'}</DialogTitle>
        <DialogDescription>
          {isEdit
            ? 'Update payroll information for this employee.'
            : `Add an employee to the ${payrollRun.name} payroll run.`}
        </DialogDescription>
      </DialogHeader>
      
      {loading ? (
        <div className="flex items-center justify-center p-6">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 py-4">
            <div className="grid gap-2">
              <Label htmlFor="employee">Employee</Label>
              <Select 
                value={employeeId} 
                onValueChange={setEmployeeId}
                disabled={isEdit}
              >
                <SelectTrigger id="employee">
                  <SelectValue placeholder="Select an employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="regularHours">Regular Hours</Label>
                <Input
                  id="regularHours"
                  type="number"
                  step="0.01"
                  value={regularHours}
                  onChange={(e) => setRegularHours(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="overtimeHours">Overtime Hours</Label>
                <Input
                  id="overtimeHours"
                  type="number"
                  step="0.01"
                  value={overtimeHours}
                  onChange={(e) => setOvertimeHours(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="hourlyRate">Hourly Rate</Label>
                <Input
                  id="hourlyRate"
                  type="number"
                  step="0.01"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="grossSalary">Gross Salary</Label>
                <Input
                  id="grossSalary"
                  type="number"
                  step="0.01"
                  value={grossSalary}
                  onChange={(e) => setGrossSalary(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="deductions">Additional Deductions</Label>
              <Input
                id="deductions"
                type="number"
                step="0.01"
                value={deductionAmount}
                onChange={(e) => setDeductionAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Enter any additional notes"
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onClose(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEdit ? 'Updating...' : 'Adding...'}
                </>
              ) : (
                isEdit ? 'Update' : 'Add to Payroll'
              )}
            </Button>
          </DialogFooter>
        </form>
      )}
    </DialogContent>
  );
}
