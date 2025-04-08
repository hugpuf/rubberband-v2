
import { Account } from "@/modules/accounting/types";
import { AccountForm, AccountFormValues } from "./AccountForm";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type EditAccountDialogProps = {
  account: Account | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: AccountFormValues) => Promise<void>;
  isSubmitting: boolean;
};

export function EditAccountDialog({
  account,
  onOpenChange,
  onSubmit,
  isSubmitting
}: EditAccountDialogProps) {
  return (
    <Dialog open={!!account} onOpenChange={(open) => !open && onOpenChange(false)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Account</DialogTitle>
          <DialogDescription>
            Update account details
          </DialogDescription>
        </DialogHeader>
        
        <AccountForm
          account={account}
          onSubmit={onSubmit}
          onCancel={() => onOpenChange(false)}
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  );
}
