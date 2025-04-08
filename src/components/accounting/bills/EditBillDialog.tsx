
import { useState, useEffect } from "react";
import { useAccounting } from "@/modules/accounting";
import { Bill, Account } from "@/modules/accounting/types";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";

// Add accounts to the props
interface EditBillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bill: Bill;
  accounts: Account[];
  onBillUpdated: (bill: Bill) => void;
}

export function EditBillDialog({
  open,
  onOpenChange,
  bill,
  accounts,
  onBillUpdated,
}: EditBillDialogProps) {
  const { updateBill } = useAccounting();
  const [updatedBill, setUpdatedBill] = useState<Bill>({ ...bill });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setUpdatedBill({ ...bill });
  }, [bill]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setUpdatedBill((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await updateBill(bill.id, updatedBill);
      
      if (result) {
        toast({
          title: "Bill updated",
          description: `Bill ${result.billNumber} has been updated`
        });
        onBillUpdated(result);
      } else {
        throw new Error("Failed to update bill");
      }
    } catch (error) {
      console.error("Error updating bill:", error);
      toast({
        variant: "destructive",
        title: "Update failed",
        description: "Failed to update the bill"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Bill #{bill.billNumber}</DialogTitle>
          <DialogDescription>
            Update the bill details below.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vendorName">Vendor</Label>
              <Input
                id="vendorName"
                name="vendorName"
                value={updatedBill.vendorName}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="billNumber">Bill Number</Label>
              <Input
                id="billNumber"
                name="billNumber"
                value={updatedBill.billNumber}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="issueDate">Issue Date</Label>
              <Input
                id="issueDate"
                name="issueDate"
                type="date"
                value={updatedBill.issueDate ? updatedBill.issueDate.substring(0, 10) : ""}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                name="dueDate"
                type="date"
                value={updatedBill.dueDate ? updatedBill.dueDate.substring(0, 10) : ""}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              value={updatedBill.notes || ""}
              onChange={handleChange}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update Bill"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
