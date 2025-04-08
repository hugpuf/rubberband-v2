
import { useState, useEffect } from "react";
import { useAccounting } from "@/modules/accounting";
import { Bill, BillItem } from "@/modules/accounting/types";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";

interface EditBillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bill: Bill;
  onBillUpdated: (bill: Bill) => void;
}

export function EditBillDialog({ 
  open, 
  onOpenChange, 
  bill, 
  onBillUpdated 
}: EditBillDialogProps) {
  const { updateBill } = useAccounting();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [items, setItems] = useState<BillItem[]>([]);

  const form = useForm({
    defaultValues: {
      vendorName: bill.vendorName,
      vendorId: bill.vendorId,
      billNumber: bill.billNumber,
      issueDate: bill.issueDate,
      dueDate: bill.dueDate,
      notes: bill.notes || "",
    },
  });

  useEffect(() => {
    // Initialize items when the bill changes or dialog opens
    if (open && bill) {
      setItems([...bill.items]);
      form.reset({
        vendorName: bill.vendorName,
        vendorId: bill.vendorId,
        billNumber: bill.billNumber,
        issueDate: bill.issueDate,
        dueDate: bill.dueDate,
        notes: bill.notes || "",
      });
    }
  }, [bill, open, form.reset]);

  const addNewItem = () => {
    setItems([
      ...items,
      { 
        id: `temp-${Date.now()}`, 
        description: "", 
        quantity: 1, 
        unitPrice: 0, 
        taxRate: 0, 
        amount: 0 
      },
    ]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    // Calculate amount
    if (field === "quantity" || field === "unitPrice") {
      const quantity = field === "quantity" ? value : newItems[index].quantity;
      const unitPrice = field === "unitPrice" ? value : newItems[index].unitPrice;
      newItems[index].amount = quantity * unitPrice;
    }

    setItems(newItems);
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + (item.amount || 0), 0);
    const taxAmount = items.reduce(
      (sum, item) => sum + ((item.amount || 0) * (item.taxRate || 0)) / 100,
      0
    );
    return {
      subtotal,
      taxAmount,
      total: subtotal + taxAmount,
    };
  };

  const { subtotal, taxAmount, total } = calculateTotals();

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);

    try {
      // Update with the new values
      const updatedBill: Partial<Bill> = {
        vendorName: data.vendorName,
        vendorId: data.vendorId,
        billNumber: data.billNumber,
        issueDate: data.issueDate,
        dueDate: data.dueDate,
        notes: data.notes,
        items: items,
        subtotal,
        taxAmount,
        total,
      };

      const result = await updateBill(bill.id, updatedBill);

      toast({
        title: "Bill updated",
        description: "Your bill has been updated successfully.",
      });

      onBillUpdated(result);
    } catch (error) {
      console.error("Error updating bill:", error);
      toast({
        variant: "destructive",
        title: "Failed to update bill",
        description: "Please try again later.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Bill</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="vendorName">Vendor Name</Label>
              <Input
                id="vendorName"
                placeholder="Enter vendor name"
                {...form.register("vendorName", { required: true })}
              />
              {form.formState.errors.vendorName && (
                <p className="text-red-500 text-sm">Vendor name is required</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="vendorId">Vendor ID</Label>
              <Input
                id="vendorId"
                placeholder="Enter vendor ID"
                {...form.register("vendorId", { required: true })}
              />
              {form.formState.errors.vendorId && (
                <p className="text-red-500 text-sm">Vendor ID is required</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="billNumber">Bill Number</Label>
              <Input
                id="billNumber"
                placeholder="Enter bill number"
                {...form.register("billNumber", { required: true })}
              />
              {form.formState.errors.billNumber && (
                <p className="text-red-500 text-sm">Bill number is required</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="issueDate">Issue Date</Label>
              <Input
                id="issueDate"
                type="date"
                {...form.register("issueDate", { required: true })}
              />
              {form.formState.errors.issueDate && (
                <p className="text-red-500 text-sm">Issue date is required</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                {...form.register("dueDate", { required: true })}
              />
              {form.formState.errors.dueDate && (
                <p className="text-red-500 text-sm">Due date is required</p>
              )}
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes for this bill"
                {...form.register("notes")}
                className="resize-none"
                rows={3}
              />
            </div>
          </div>

          <div className="space-y-4 mt-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Items</h3>
              <Button type="button" variant="outline" size="sm" onClick={addNewItem}>
                <Plus className="h-4 w-4 mr-2" /> Add Item
              </Button>
            </div>

            <div className="border rounded-md">
              <div className="grid grid-cols-12 gap-2 p-3 bg-muted font-medium text-sm">
                <div className="col-span-5">Description</div>
                <div className="col-span-2 text-center">Quantity</div>
                <div className="col-span-2 text-center">Unit Price</div>
                <div className="col-span-2 text-center">Tax Rate (%)</div>
                <div className="col-span-1"></div>
              </div>

              {items.map((item, index) => (
                <div
                  key={item.id || index}
                  className="grid grid-cols-12 gap-2 p-3 border-t items-center"
                >
                  <div className="col-span-5">
                    <Input
                      value={item.description || ""}
                      onChange={(e) =>
                        updateItem(index, "description", e.target.value)
                      }
                      placeholder="Item description"
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity || ""}
                      onChange={(e) =>
                        updateItem(index, "quantity", parseFloat(e.target.value) || 0)
                      }
                      className="text-center"
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitPrice || ""}
                      onChange={(e) =>
                        updateItem(index, "unitPrice", parseFloat(e.target.value) || 0)
                      }
                      className="text-center"
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={item.taxRate || ""}
                      onChange={(e) =>
                        updateItem(index, "taxRate", parseFloat(e.target.value) || 0)
                      }
                      className="text-center"
                    />
                  </div>
                  <div className="col-span-1 text-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(index)}
                      disabled={items.length === 1}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              ))}

              <div className="p-3 border-t bg-white">
                <div className="flex justify-end space-x-4 text-sm">
                  <div className="w-32 space-y-1">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax:</span>
                      <span>${taxAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-medium pt-1 border-t">
                      <span>Total:</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-6">
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
