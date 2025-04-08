
import { useState, useEffect } from "react";
import { useAccounting } from "@/modules/accounting";
import { Transaction, Account } from "@/modules/accounting/types";
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
import { z } from "zod";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";

interface EditTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: Transaction;
  accounts: Account[];
  onTransactionUpdated: (transaction: Transaction) => void;
}

const transactionLineSchema = z.object({
  id: z.string().optional(),
  accountId: z.string().min(1, "Account is required"),
  description: z.string().optional(),
  debitAmount: z.coerce.number().min(0, "Debit must be a positive number or zero"),
  creditAmount: z.coerce.number().min(0, "Credit must be a positive number or zero"),
}).refine(data => {
  // Either debit or credit should be zero, not both have values
  return (data.debitAmount === 0 || data.creditAmount === 0);
}, {
  message: "Either debit or credit must be zero",
  path: ["debitAmount"],
});

const transactionSchema = z.object({
  date: z.date(),
  description: z.string().min(3, "Description is required"),
  referenceNumber: z.string().optional(),
  status: z.enum(["draft", "posted", "voided"]).default("draft"),
  lines: z.array(transactionLineSchema).min(2, "At least two transaction lines are required"),
}).refine(data => {
  // Check if the transaction is balanced
  const totalDebits = data.lines.reduce((sum, line) => sum + line.debitAmount, 0);
  const totalCredits = data.lines.reduce((sum, line) => sum + line.creditAmount, 0);
  return Math.abs(totalDebits - totalCredits) < 0.01; // Allow for small rounding errors
}, {
  message: "Transaction must be balanced (total debits must equal total credits)",
  path: ["lines"],
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

export function EditTransactionDialog({
  open,
  onOpenChange,
  transaction,
  accounts,
  onTransactionUpdated,
}: EditTransactionDialogProps) {
  const { updateTransaction, createTransaction, deleteTransaction } = useAccounting();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Convert the transaction to form values
  const defaultValues: TransactionFormValues = {
    date: new Date(transaction.date),
    description: transaction.description,
    referenceNumber: transaction.referenceNumber || "",
    status: transaction.status,
    lines: transaction.lines.map(line => ({
      id: line.id,
      accountId: line.accountId,
      description: line.description || "",
      debitAmount: line.debitAmount,
      creditAmount: line.creditAmount,
    })),
  };

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lines",
  });

  // When the transaction prop changes, update the form
  useEffect(() => {
    if (transaction) {
      form.reset({
        date: new Date(transaction.date),
        description: transaction.description,
        referenceNumber: transaction.referenceNumber || "",
        status: transaction.status,
        lines: transaction.lines.map(line => ({
          id: line.id,
          accountId: line.accountId,
          description: line.description || "",
          debitAmount: line.debitAmount,
          creditAmount: line.creditAmount,
        })),
      });
    }
  }, [transaction, form.reset]);

  const onSubmit = async (data: TransactionFormValues) => {
    setIsSubmitting(true);
    try {
      // Ensure no empty transaction lines
      const validLines = data.lines.filter(
        line => line.accountId && (line.debitAmount > 0 || line.creditAmount > 0)
      );
      
      // For complex updates, it might be easier to delete the old transaction and create a new one
      // This is especially true if the UI allows adding/removing lines
      const success = await deleteTransaction(transaction.id);
      
      if (!success) {
        throw new Error("Failed to update transaction (deletion step failed)");
      }
      
      const newTransaction = await createTransaction({
        date: format(data.date, 'yyyy-MM-dd'),
        description: data.description,
        referenceNumber: data.referenceNumber || undefined,
        status: data.status,
        lines: validLines.map(line => ({
          accountId: line.accountId,
          description: line.description || undefined,
          debitAmount: line.debitAmount,
          creditAmount: line.creditAmount,
        })),
      });
      
      if (!newTransaction) {
        throw new Error("Failed to update transaction (creation step failed)");
      }
      
      toast({
        title: "Transaction updated",
        description: "The transaction has been updated successfully",
      });
      
      onTransactionUpdated(newTransaction);
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating transaction:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update transaction",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate transaction balance
  const calculateBalance = () => {
    const values = form.getValues();
    
    const totalDebits = values.lines.reduce(
      (sum, line) => sum + (parseFloat(line.debitAmount.toString()) || 0), 
      0
    );
    
    const totalCredits = values.lines.reduce(
      (sum, line) => sum + (parseFloat(line.creditAmount.toString()) || 0), 
      0
    );
    
    const difference = totalDebits - totalCredits;
    
    return {
      totalDebits,
      totalCredits,
      difference,
      isBalanced: Math.abs(difference) < 0.01, // Allow for small rounding errors
    };
  };

  const balance = calculateBalance();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Edit Transaction</DialogTitle>
          <DialogDescription>
            Modify the transaction details below.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={
                              "pl-3 text-left font-normal flex justify-between items-center"
                            }
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="posted">Posted</SelectItem>
                        <SelectItem value="voided">Voided</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="referenceNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reference Number (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter reference number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter transaction description" 
                      className="resize-none" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <Label>Transaction Lines</Label>
                  <p className="text-sm text-muted-foreground">
                    Add debit and credit lines to balance the transaction.
                  </p>
                </div>
                <div className="space-x-2">
                  <Badge variant={balance.isBalanced ? "default" : "destructive"}>
                    {balance.isBalanced 
                      ? "Balanced" 
                      : `Unbalanced (${balance.difference > 0 ? "Excess Debit" : "Excess Credit"}: $${Math.abs(balance.difference).toFixed(2)})`}
                  </Badge>
                </div>
              </div>

              <div className="border rounded-md p-4 space-y-4">
                <div className="grid grid-cols-12 gap-2 mb-2 text-sm font-medium">
                  <div className="col-span-4">Account</div>
                  <div className="col-span-3">Description</div>
                  <div className="col-span-2">Debit</div>
                  <div className="col-span-2">Credit</div>
                  <div className="col-span-1"></div>
                </div>
                
                {fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-4">
                      <FormField
                        control={form.control}
                        name={`lines.${index}.accountId`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Select
                                onValueChange={field.onChange}
                                value={field.value}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select account" />
                                </SelectTrigger>
                                <SelectContent>
                                  {accounts.map((account) => (
                                    <SelectItem key={account.id} value={account.id}>
                                      {account.code} - {account.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="col-span-3">
                      <FormField
                        control={form.control}
                        name={`lines.${index}.description`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input placeholder="Description" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="col-span-2">
                      <FormField
                        control={form.control}
                        name={`lines.${index}.debitAmount`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.01" 
                                min="0" 
                                placeholder="0.00"
                                {...field}
                                onChange={(e) => {
                                  field.onChange(e);
                                  // If debit has a value, clear credit (following double-entry principle)
                                  if (parseFloat(e.target.value) > 0) {
                                    form.setValue(`lines.${index}.creditAmount`, 0);
                                  }
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="col-span-2">
                      <FormField
                        control={form.control}
                        name={`lines.${index}.creditAmount`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.01" 
                                min="0" 
                                placeholder="0.00"
                                {...field}
                                onChange={(e) => {
                                  field.onChange(e);
                                  // If credit has a value, clear debit (following double-entry principle)
                                  if (parseFloat(e.target.value) > 0) {
                                    form.setValue(`lines.${index}.debitAmount`, 0);
                                  }
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="col-span-1 flex justify-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => {
                          if (fields.length > 2) {
                            remove(index);
                          } else {
                            toast({
                              variant: "destructive",
                              title: "Minimum Lines Required",
                              description: "A transaction must have at least two lines"
                            });
                          }
                        }}
                      >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Remove</span>
                      </Button>
                    </div>
                  </div>
                ))}
                
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => {
                    append({ accountId: "", description: "", debitAmount: 0, creditAmount: 0 });
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Line
                </Button>
              </div>
              
              <div className="flex justify-end space-x-4 text-sm">
                <div className="text-right">
                  <div>Total Debits:</div>
                  <div>Total Credits:</div>
                  <div className="font-semibold mt-1">Difference:</div>
                </div>
                <div className="text-right w-24">
                  <div>${balance.totalDebits.toFixed(2)}</div>
                  <div>${balance.totalCredits.toFixed(2)}</div>
                  <div className={`font-semibold mt-1 ${balance.isBalanced ? 'text-green-600' : 'text-red-600'}`}>
                    ${Math.abs(balance.difference).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || !balance.isBalanced}
              >
                {isSubmitting ? "Updating..." : "Update Transaction"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
