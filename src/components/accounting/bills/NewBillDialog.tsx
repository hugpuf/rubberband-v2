import { useState, useEffect } from "react";
import { useAccounting } from "@/modules/accounting";
import { Bill, BillItem } from "@/modules/accounting/types";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Search } from "lucide-react";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";

interface NewBillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBillCreated?: (bill: Bill) => void;
}

interface Vendor {
  id: string;
  name: string;
}

export function NewBillDialog({ open, onOpenChange, onBillCreated }: NewBillDialogProps) {
  const { createBill } = useAccounting();
  const { organization } = useOrganization();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [vendorSearchQuery, setVendorSearchQuery] = useState("");
  const [isLoadingVendors, setIsLoadingVendors] = useState(false);
  const [showVendorPopover, setShowVendorPopover] = useState(false);

  const [items, setItems] = useState<Partial<BillItem>[]>([
    { description: "", quantity: 1, unitPrice: 0, taxRate: 0, amount: 0, accountId: "6" },
  ]);

  const form = useForm({
    defaultValues: {
      vendorName: "",
      vendorId: "",
      billNumber: "",
      issueDate: new Date().toISOString().split("T")[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      notes: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        vendorName: "",
        vendorId: "",
        billNumber: "",
        issueDate: new Date().toISOString().split("T")[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        notes: "",
      });
      setItems([
        { description: "", quantity: 1, unitPrice: 0, taxRate: 0, amount: 0, accountId: "6" },
      ]);
      fetchVendors();
    }
  }, [open, form.reset]);

  const fetchVendors = async () => {
    if (!organization?.id) return;
    
    setIsLoadingVendors(true);
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('id, name')
        .eq('organization_id', organization.id)
        .eq('type', 'vendor');

      if (error) throw error;
      
      setVendors(data || []);
    } catch (error) {
      console.error("Error fetching vendors:", error);
    } finally {
      setIsLoadingVendors(false);
    }
  };

  const addNewItem = () => {
    setItems([
      ...items,
      { description: "", quantity: 1, unitPrice: 0, taxRate: 0, amount: 0, accountId: "6" },
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

  const filteredVendors = vendorSearchQuery
    ? vendors.filter(vendor => 
        vendor.name.toLowerCase().includes(vendorSearchQuery.toLowerCase())
      )
    : vendors;

  const handleSelectVendor = (vendor: Vendor) => {
    form.setValue("vendorName", vendor.name);
    form.setValue("vendorId", vendor.id);
    setShowVendorPopover(false);
  };

  const { subtotal, taxAmount, total } = calculateTotals();

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);

    try {
      if (!data.vendorName) {
        toast({
          variant: "destructive",
          title: "Vendor name is required",
          description: "Please enter a vendor name",
        });
        setIsSubmitting(false);
        return;
      }

      const billItems = items.map((item, index) => ({
        id: `temp-${index}`,
        description: item.description || "",
        quantity: item.quantity || 0,
        unitPrice: item.unitPrice || 0,
        taxRate: item.taxRate || 0,
        amount: item.amount || 0,
        accountId: item.accountId || "6"
      }));

      let vendorId = data.vendorId;
      
      if (!vendorId && organization?.id) {
        try {
          console.log("Creating new vendor:", {
            organization_id: organization.id,
            name: data.vendorName,
            type: 'vendor'
          });
          
          const { data: vendorData, error } = await supabase
            .from('contacts')
            .insert({
              organization_id: organization.id,
              name: data.vendorName,
              type: 'vendor'
            })
            .select('id')
            .single();
            
          if (error) {
            console.error("Error creating vendor:", error);
            console.error("Error details:", error.details, error.hint, error.message);
            throw error;
          }
          vendorId = vendorData.id;
          console.log("Vendor created with ID:", vendorId);
        } catch (error) {
          console.error("Error creating vendor:", error);
        }
      }

      const billData: Omit<Bill, "id" | "createdAt" | "updatedAt"> & { organization_id: string } = {
        billNumber: data.billNumber || `BILL-${Date.now().toString().substring(7)}`,
        vendorId: vendorId || 'temp-vendor',
        vendorName: data.vendorName,
        issueDate: data.issueDate,
        dueDate: data.dueDate,
        items: billItems,
        subtotal,
        taxAmount,
        total,
        notes: data.notes || undefined,
        status: "draft",
        organization_id: organization?.id || ""
      };

      console.log("Creating bill with data:", billData);
      console.log("Bill data structure:", {
        vendorId: typeof billData.vendorId,
        vendorName: typeof billData.vendorName,
        issueDate: typeof billData.issueDate,
        organization_id: typeof billData.organization_id,
        status: billData.status
      });
      
      const newBill = await createBill(billData);

      toast({
        title: "Bill created",
        description: "Your bill has been created successfully.",
      });

      if (onBillCreated) {
        onBillCreated(newBill);
      }

      onOpenChange(false);
    } catch (error) {
      console.error("Error creating bill:", error);
      console.error("Error stack:", error.stack);
      
      toast({
        variant: "destructive",
        title: "Failed to create bill",
        description: "Please try again later. Check console for details.",
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
              <Label htmlFor="vendorName">Vendor</Label>
              <div className="flex">
                <Input
                  id="vendorName"
                  placeholder="Enter or select vendor"
                  {...form.register("vendorName", { required: true })}
                  className="rounded-r-none"
                />
                <Popover open={showVendorPopover} onOpenChange={setShowVendorPopover}>
                  <PopoverTrigger asChild>
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="rounded-l-none border-l-0 px-2"
                    >
                      <Search className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0">
                    <div className="p-2">
                      <Input
                        placeholder="Search vendors..."
                        value={vendorSearchQuery}
                        onChange={(e) => setVendorSearchQuery(e.target.value)}
                        className="border-slate-200"
                      />
                    </div>
                    <div className="max-h-[200px] overflow-y-auto">
                      {isLoadingVendors ? (
                        <div className="p-2 text-center text-sm text-muted-foreground">
                          Loading vendors...
                        </div>
                      ) : filteredVendors.length === 0 ? (
                        <div className="p-2 text-center text-sm text-muted-foreground">
                          No vendors found
                        </div>
                      ) : (
                        filteredVendors.map((vendor) => (
                          <div
                            key={vendor.id}
                            className="px-2 py-1 hover:bg-muted cursor-pointer text-sm"
                            onClick={() => handleSelectVendor(vendor)}
                          >
                            {vendor.name}
                          </div>
                        ))
                      )}
                    </div>
                    <div className="p-2 border-t">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="w-full text-muted-foreground"
                        onClick={() => setShowVendorPopover(false)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create new vendor
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <Input
                type="hidden"
                id="vendorId"
                {...form.register("vendorId")}
              />
              {form.formState.errors.vendorName && (
                <p className="text-red-500 text-sm">Vendor is required</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="billNumber">Bill Number</Label>
              <Input
                id="billNumber"
                placeholder="Auto-generated if left empty"
                {...form.register("billNumber")}
              />
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
              {isSubmitting ? "Creating..." : "Create Bill"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
