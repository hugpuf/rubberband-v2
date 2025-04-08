
import { useState } from "react";
import { Account } from "@/modules/accounting/types";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const balanceAdjustmentSchema = z.object({
  amount: z.string().refine(
    (val) => !isNaN(Number(val)) && Number(val) !== 0,
    { message: "Amount must be a non-zero number" }
  ),
  description: z.string().min(3, "Description must be at least 3 characters"),
});

type BalanceAdjustmentFormValues = z.infer<typeof balanceAdjustmentSchema>;

type AdjustBalanceDialogProps = {
  account: Account | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: BalanceAdjustmentFormValues) => Promise<void>;
  isSubmitting: boolean;
};

export function AdjustBalanceDialog({
  account,
  onOpenChange,
  onSubmit,
  isSubmitting
}: AdjustBalanceDialogProps) {
  const form = useForm<BalanceAdjustmentFormValues>({
    resolver: zodResolver(balanceAdjustmentSchema),
    defaultValues: {
      amount: "",
      description: "",
    },
  });

  // Reset form when dialog opens/closes
  if (account && !form.formState.isDirty) {
    form.reset();
  }

  const handleSubmit = async (values: BalanceAdjustmentFormValues) => {
    await onSubmit(values);
    form.reset();
  };

  return (
    <Dialog open={!!account} onOpenChange={(open) => !open && onOpenChange(false)}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Adjust Account Balance</DialogTitle>
          <DialogDescription>
            {account ? `Adjust the balance for ${account.name} (${account.code})` : ""}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adjustment Amount</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter amount (positive for increase, negative for decrease)"
                      />
                    </FormControl>
                    <FormDescription>
                      Current balance: ${account?.balance.toFixed(2)}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason for Adjustment</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Enter reason for adjustment"
                        rows={3}
                      />
                    </FormControl>
                    <FormDescription>
                      Please provide a detailed explanation for the adjustment
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adjusting...
                  </>
                ) : (
                  "Adjust Balance"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
