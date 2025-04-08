
import { useState } from "react";
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
import { X, Plus } from "lucide-react";

interface NewInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvoiceCreated?: (invoice: Invoice) => void;
}

interface TempInvoiceItem extends Omit<InvoiceItem, "id"> {
  tempId: string;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const subtotal = calculateSubtotal();
    const taxAmount = calculateTaxAmount();
    const total = calculateTotal();

    try {
      const invoiceToCreate = {
        invoiceNumber,
        customerId,
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
        notes: notes || undefined
      };

      const newInvoice = await createInvoice(invoiceToCreate);

      toast({
        title: "Invoice created",
        description: "The invoice has been created successfully",
      });
      
      // Reset form
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

      // Notify parent
      if (onInvoiceCreated) {
        onInvoiceCreated(newInvoice);
      }
      
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating invoice:", error);
      toast({
        variant: "destructive",
        title: "Failed to create invoice",
        description: "There was an error creating the invoice",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCustomerChange = (value: string) => {
    setCustomerId(value);
    // In a real app, you'd fetch the customer details from the database
    // For now, we'll use hardcoded names based on the customer ID
    setCustomerName(
      value === 'customer-1' ? 'Acme Corp' : 
      value === 'customer-2' ? 'Globex Inc' : 
      value === 'customer-3' ? 'ABC Enterprises' : 'Unknown'
    );
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
                  placeholder="INV-001"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerId">Customer</Label>
                <Select
                  value={customerId}
                  onValueChange={handleCustomerChange}
                  required
                >
                  <SelectTrigger id="customerId">
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer-1">Acme Corp</SelectItem>
                    <SelectItem value="customer-2">Globex Inc</SelectItem>
                    <SelectItem value="customer-3">ABC Enterprises</SelectItem>
                  </SelectContent>
                </Select>
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
