import { useState } from "react";
import { useAccounting } from "@/modules/accounting";
import { Bill, BillItem } from "@/modules/accounting/types";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";

interface NewBillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewBillDialog({ open, onOpenChange }: NewBillDialogProps) {
  const { createBill } = useAccounting();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize with one empty item
  const [items, setItems] = useState<Partial<BillItem>[]>([
    { description: "", quantity: 1, unitPrice: 0, taxRate: 0 },
  ]);

  const form = useForm({
    defaultValues: {
      vendorId: "",
      billNumber: "",
      issueDate: new Date().toISOString().split("T")[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
    },
  });

  const addNewItem = () => {
    setItems([
      ...items,
      { description: "", quantity: 1, unitPrice: 0, taxRate: 0 },
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
      const quantity = field === "quantity" ? value : newItems[index].quantity || 0;
      const unitPrice = field === "unitPrice" ? value : newItems[index].unitPrice || 0;
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
      // Convert items to the required format
      const billItems = items.map((item, index) => ({
        id: `temp-${index}`,
        description: item.description || "",
        quantity: item.quantity || 0,
        unitPrice: item.unitPrice || 0,
        taxRate: item.taxRate || 0,
        amount: item.amount || 0,
      }));

      const billData: Omit<Bill, "id" | "createdAt" | "updatedAt"> = {
        billNumber: data.billNumber,
        vendorId: data.vendorId,
        vendorName: "Vendor Name",
        issueDate: data.issueDate,
        dueDate: data.dueDate,
        items: billItems,
        subtotal,
        taxAmount,
        total,
        status: "draft",
      };

      await createBill(billData);

      toast({
        title: "Bill created",
        description: "Your bill has been created successfully.",
      });

      onOpenChange(false);
    } catch (error) {
      console.error("Error creating bill:", error);
      toast({
        variant: "destructive",
        title: "Failed to create bill",
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
          <DialogTitle>Create New Bill</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="vendorId">Vendor</Label>
              <Input
                id="vendorId"
                placeholder="Select or enter vendor"
                {...form.register("vendorId", { required: true })}
              />
              {form.formState.errors.vendorId && (
                <p className="text-red-500 text-sm">Vendor is required</p>
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
                  key={index}
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
                        updateItem(index, "quantity", parseInt(e.target.value) || 0)
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
              {isSubmitting ? "Creating..." : "Create Bill"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
