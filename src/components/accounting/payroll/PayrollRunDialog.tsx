
import { useState } from "react";
import { useAccounting } from "@/modules/accounting";
import { useToast } from "@/hooks/use-toast";
import { CreatePayrollRunParams, UpdatePayrollRunParams, PayrollRun } from "@/modules/accounting/types";
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
import { Loader2, Calendar } from "lucide-react";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

interface PayrollRunDialogProps {
  payrollRun?: PayrollRun;
  onClose: (updated: boolean) => void;
}

export function PayrollRunDialog({ payrollRun, onClose }: PayrollRunDialogProps) {
  const { createPayrollRun, updatePayrollRun } = useAccounting();
  const { toast } = useToast();
  
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [name, setName] = useState(payrollRun?.name || '');
  const [periodStart, setPeriodStart] = useState<Date | undefined>(
    payrollRun?.periodStart ? new Date(payrollRun.periodStart) : undefined
  );
  const [periodEnd, setPeriodEnd] = useState<Date | undefined>(
    payrollRun?.periodEnd ? new Date(payrollRun.periodEnd) : undefined
  );
  const [paymentDate, setPaymentDate] = useState<Date | undefined>(
    payrollRun?.paymentDate ? new Date(payrollRun.paymentDate) : undefined
  );
  const [notes, setNotes] = useState(payrollRun?.notes || '');
  
  const isEdit = !!payrollRun;
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !periodStart || !periodEnd || !paymentDate) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all required fields."
      });
      return;
    }
    
    setSaving(true);
    
    try {
      const formData: CreatePayrollRunParams | UpdatePayrollRunParams = {
        name,
        periodStart: periodStart.toISOString().split('T')[0],
        periodEnd: periodEnd.toISOString().split('T')[0],
        paymentDate: paymentDate.toISOString().split('T')[0],
        notes,
        status: isEdit ? payrollRun.status : 'draft'
      };
      
      if (isEdit && payrollRun) {
        await updatePayrollRun(payrollRun.id, formData);
        toast({
          title: "Payroll run updated",
          description: "The payroll run has been updated."
        });
      } else {
        await createPayrollRun(formData as CreatePayrollRunParams);
        toast({
          title: "Payroll run created",
          description: "A new payroll run has been created."
        });
      }
      
      onClose(true);
    } catch (error) {
      console.error("Error saving payroll run:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: isEdit ? "Failed to update payroll run." : "Failed to create payroll run."
      });
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <DialogContent className="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle>{isEdit ? 'Edit Payroll Run' : 'Create New Payroll Run'}</DialogTitle>
        <DialogDescription>
          {isEdit
            ? 'Update the details of this payroll run.'
            : 'Enter the details to create a new payroll run.'}
        </DialogDescription>
      </DialogHeader>
      
      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Payroll Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Monthly Payroll - April 2025"
              required
            />
          </div>
          
          <div className="grid gap-2">
            <Label>Period Start</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !periodStart && "text-muted-foreground"
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {periodStart ? format(periodStart, "PPP") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <CalendarComponent
                  mode="single"
                  selected={periodStart}
                  onSelect={setPeriodStart}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="grid gap-2">
            <Label>Period End</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !periodEnd && "text-muted-foreground"
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {periodEnd ? format(periodEnd, "PPP") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <CalendarComponent
                  mode="single"
                  selected={periodEnd}
                  onSelect={setPeriodEnd}
                  initialFocus
                  disabled={(date) => {
                    // Disable dates before period start
                    return periodStart ? date < periodStart : false;
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="grid gap-2">
            <Label>Payment Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !paymentDate && "text-muted-foreground"
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {paymentDate ? format(paymentDate, "PPP") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <CalendarComponent
                  mode="single"
                  selected={paymentDate}
                  onSelect={setPaymentDate}
                  initialFocus
                  disabled={(date) => {
                    // Disable dates before period end
                    return periodEnd ? date < periodEnd : false;
                  }}
                />
              </PopoverContent>
            </Popover>
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
                {isEdit ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              isEdit ? 'Update' : 'Create'
            )}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
