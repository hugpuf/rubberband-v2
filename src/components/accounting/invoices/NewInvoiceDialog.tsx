
import { useState, useEffect } from "react";
import { useAccounting } from "@/modules/accounting";
import { useOrganization } from "@/hooks/useOrganization";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Invoice, InvoiceItem } from "@/modules/accounting/types";
import { X, Plus, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface NewInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvoiceCreated?: (invoice: Invoice) => void;
}

interface TempInvoiceItem extends Omit<InvoiceItem, "id"> {
  tempId: string;
}

interface Customer {
  id: string;
  name: string;
}

export function NewInvoiceDialog({ 
  open, 
  onOpenChange, 
  onInvoiceCreated 
}: NewInvoiceDialogProps) {
  const { createInvoice } = useAccounting();
  const { organization } = useOrganization();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [showCustomerPopover, setShowCustomerPopover] = useState(false);

  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [issueDate, setIssueDate] = useState(
    new Date().toISOString().substring(0, 10)
  );
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .substring(0, 10)
  );
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<TempInvoiceItem[]>([
    {
      tempId: "temp-1",
      description: "",
      quantity: 1,
      unitPrice: 0,
      taxRate: 10,
      amount: 0,
      accountId: "5" // Default to Sales Revenue account
    },
  ]);

  useEffect(() => {
    if (open) {
      // Reset form when dialog opens
      setInvoiceNumber("");
      setCustomerId("");
      setCustomerName("");
      setIssueDate(new Date().toISOString().substring(0, 10));
      setDueDate(
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .substring(0, 10)
      );
      setNotes("");
      setItems([
        {
          tempId: "temp-1",
          description: "",
          quantity: 1,
          unitPrice: 0,
          taxRate: 10,
          amount: 0,
          accountId: "5" // Default to Sales Revenue account
        },
      ]);
      
      fetchCustomers();
    }
  }, [open]);

  const fetchCustomers = async () => {
    if (!organization?.id) return;
    
    setIsLoadingCustomers(true);
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('id, name')
        .eq('organization_id', organization.id)
        .eq('type', 'customer');

      if (error) throw error;
      
      setCustomers(data || []);
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setIsLoadingCustomers(false);
    }
  };

  const calculateItemAmount = (
    quantity: number,
    unitPrice: number
  ): number => {
    return quantity * unitPrice;
  };

  const updateItem = (
    tempId: string,
    field: keyof Omit<InvoiceItem, "id">,
    value: any
  ) => {
    setItems(
      items.map((item) => {
        if (item.tempId === tempId) {
          const updatedItem = { ...item, [field]: value };

          if (field === "quantity" || field === "unitPrice") {
            updatedItem.amount = calculateItemAmount(
              field === "quantity" ? value : item.quantity,
              field === "unitPrice" ? value : item.unitPrice
            );
          }

          return updatedItem;
        }
        return item;
      })
    );
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        tempId: `temp-${Date.now()}`,
        description: "",
        quantity: 1,
        unitPrice: 0,
        taxRate: 10,
        amount: 0,
        accountId: "5" // Default to Sales Revenue account
      },
    ]);
  };

  const removeItem = (tempId: string) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.tempId !== tempId));
    }
  };

  const calculateSubtotal = (): number => {
    return items.reduce((acc, item) => acc + (item.amount || 0), 0);
  };

  const calculateTaxAmount = (): number => {
    return items.reduce(
      (acc, item) => acc + ((item.amount || 0) * (item.taxRate || 0)) / 100,
      0
    );
  };

  const calculateTotal = (): number => {
    return calculateSubtotal() + calculateTaxAmount();
  };

  const filteredCustomers = customerSearchQuery
    ? customers.filter(customer => 
        customer.name.toLowerCase().includes(customerSearchQuery.toLowerCase())
      )
    : customers;

  const handleSelectCustomer = (customer: Customer) => {
    setCustomerId(customer.id);
    setCustomerName(customer.name);
    setShowCustomerPopover(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const subtotal = calculateSubtotal();
    const taxAmount = calculateTaxAmount();
    const total = calculateTotal();

    try {
      if (!customerName) {
        toast({
          variant: "destructive",
          title: "Customer name is required",
          description: "Please enter a customer name",
        });
        setIsSubmitting(false);
        return;
      }

      let createdCustomerId = customerId;
      
      // If no customer ID but we have a name, create a new customer
      if (!createdCustomerId && organization?.id) {
        try {
          console.log("Creating new customer:", {
            organization_id: organization.id,
            name: customerName,
            type: 'customer'
          });
          
          const { data: customerData, error } = await supabase
            .from('contacts')
            .insert({
              organization_id: organization.id,
              name: customerName,
              type: 'customer'
            })
            .select('id')
            .single();
            
          if (error) {
            console.error("Error creating customer:", error);
            console.error("Error details:", error.details, error.hint, error.message);
            throw error;
          }
          
          createdCustomerId = customerData.id;
          console.log("Customer created with ID:", createdCustomerId);
        } catch (error) {
          console.error("Error creating customer:", error);
        }
      }

      const invoiceToCreate = {
        invoiceNumber: invoiceNumber || undefined, // Let database trigger generate it if empty
        customerId: createdCustomerId || 'temp-customer',
        customerName,
        issueDate,
        dueDate,
        items: items.map(({ tempId, ...item }) => ({
          ...item,
          id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        })),
        subtotal,
        taxAmount,
        total,
        status: "draft" as const,
        notes: notes || undefined,
        organization_id: organization?.id || ""
      };

      console.log("Creating invoice with data:", invoiceToCreate);
      
      const newInvoice = await createInvoice(invoiceToCreate);

      toast({
        title: "Invoice created",
        description: "The invoice has been created successfully",
      });
      
      if (onInvoiceCreated) {
        onInvoiceCreated(newInvoice);
      }
      
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating invoice:", error);
      console.error("Error stack:", error.stack);
      
      toast({
        variant: "destructive",
        title: "Failed to create invoice",
        description: "Please try again later. Check console for details.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Invoice</DialogTitle>
          <DialogDescription>
            Create a new invoice for your customer
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="invoiceNumber">Invoice Number</Label>
                <Input
                  id="invoiceNumber"
                  placeholder="Auto-generated if left empty"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerId">Customer</Label>
                <div className="flex">
                  <Input
                    id="customerName"
                    placeholder="Enter or select customer"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="rounded-r-none"
                    required
                  />
                  <Popover open={showCustomerPopover} onOpenChange={setShowCustomerPopover}>
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
                          placeholder="Search customers..."
                          value={customerSearchQuery}
                          onChange={(e) => setCustomerSearchQuery(e.target.value)}
                          className="border-slate-200"
                        />
                      </div>
                      <div className="max-h-[200px] overflow-y-auto">
                        {isLoadingCustomers ? (
                          <div className="p-2 text-center text-sm text-muted-foreground">
                            Loading customers...
                          </div>
                        ) : filteredCustomers.length === 0 ? (
                          <div className="p-2 text-center text-sm text-muted-foreground">
                            No customers found
                          </div>
                        ) : (
                          filteredCustomers.map((customer) => (
                            <div
                              key={customer.id}
                              className="px-2 py-1 hover:bg-muted cursor-pointer text-sm"
                              onClick={() => handleSelectCustomer(customer)}
                            >
                              {customer.name}
                            </div>
                          ))
                        )}
                      </div>
                      <div className="p-2 border-t">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="w-full text-muted-foreground"
                          onClick={() => setShowCustomerPopover(false)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Create new customer
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="issueDate">Issue Date</Label>
                <Input
                  id="issueDate"
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Line Items</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addItem}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Item
                </Button>
              </div>

              <div className="space-y-4">
                {items.map((item, index) => (
                  <div
                    key={item.tempId}
                    className="grid grid-cols-12 gap-2 items-start border-b pb-4"
                  >
                    <div className="col-span-5">
                      <Label htmlFor={`description-${index}`} className="sr-only">
                        Description
                      </Label>
                      <Textarea
                        id={`description-${index}`}
                        placeholder="Item description"
                        value={item.description}
                        onChange={(e) =>
                          updateItem(item.tempId, "description", e.target.value)
                        }
                        className="resize-none h-10"
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor={`quantity-${index}`} className="sr-only">
                        Quantity
                      </Label>
                      <Input
                        id={`quantity-${index}`}
                        type="number"
                        placeholder="Qty"
                        min="1"
                        step="1"
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(
                            item.tempId,
                            "quantity",
                            parseInt(e.target.value)
                          )
                        }
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor={`unitPrice-${index}`} className="sr-only">
                        Unit Price
                      </Label>
                      <Input
                        id={`unitPrice-${index}`}
                        type="number"
                        placeholder="Price"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) =>
                          updateItem(
                            item.tempId,
                            "unitPrice",
                            parseFloat(e.target.value)
                          )
                        }
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor={`taxRate-${index}`} className="sr-only">
                        Tax Rate
                      </Label>
                      <Input
                        id={`taxRate-${index}`}
                        type="number"
                        placeholder="Tax %"
                        min="0"
                        step="0.1"
                        value={item.taxRate}
                        onChange={(e) =>
                          updateItem(
                            item.tempId,
                            "taxRate",
                            parseFloat(e.target.value)
                          )
                        }
                        required
                      />
                    </div>
                    <div className="col-span-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(item.tempId)}
                        disabled={items.length <= 1}
                        className="h-10 w-10 p-0"
                      >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Remove item</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Notes or payment instructions"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="resize-none h-20"
              />
            </div>

            <div className="space-y-2 ml-auto w-1/3">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>${calculateSubtotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tax:</span>
                <span>${calculateTaxAmount().toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-medium border-t pt-2">
                <span>Total:</span>
                <span>${calculateTotal().toFixed(2)}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Invoice"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
