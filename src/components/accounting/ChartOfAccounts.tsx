
import { useState, useEffect } from "react";
import { useAccounting } from "@/modules/accounting";
import { Account, AccountType } from "@/modules/accounting/types";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { logUserAction } from "@/services/userLogs";

// Import refactored components
import { AccountsHeader } from "./accounts/AccountsHeader";
import { AccountsTable } from "./accounts/AccountsTable";
import { CreateAccountDialog } from "./accounts/CreateAccountDialog";
import { EditAccountDialog } from "./accounts/EditAccountDialog";
import { DeleteAccountDialog } from "./accounts/DeleteAccountDialog";
import { AdjustBalanceDialog } from "./accounts/AdjustBalanceDialog";
import { AccountFormValues } from "./accounts/AccountForm";

export function ChartOfAccounts() {
  const { state, getAccounts, createAccount, updateAccount, deleteAccount, adjustAccountBalance } = useAccounting();
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<AccountType | "all">("all");
  const [accountToDelete, setAccountToDelete] = useState<Account | null>(null);
  const [accountToAdjust, setAccountToAdjust] = useState<Account | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load accounts on component mount
  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const accountsData = await getAccounts();
      setAccounts(accountsData);
      setError(null);
    } catch (err) {
      console.error("Error fetching accounts:", err);
      setError("Unable to load accounts. Please try again later.");
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load accounts. Please try again."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubmit = async (values: AccountFormValues) => {
    try {
      setIsSubmitting(true);
      const newAccount = await createAccount({
        code: values.code,
        name: values.name,
        type: values.type,
        description: values.description,
        isActive: true,
      });
      
      setAccounts((prev) => [...prev, newAccount]);
      setIsCreatingAccount(false);
      
      toast({
        title: "Account Created",
        description: `Account "${newAccount.name}" has been created successfully.`
      });
      
      // Log user action
      await logUserAction({
        module: "accounting",
        action: "create_account",
        recordId: newAccount.id,
        metadata: { account_name: newAccount.name }
      });
    } catch (err) {
      console.error("Error creating account:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create account. Please try again."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (values: AccountFormValues) => {
    if (!editingAccount) return;
    
    try {
      setIsSubmitting(true);
      const updatedAccount = await updateAccount(editingAccount.id, {
        code: values.code,
        name: values.name,
        type: values.type,
        description: values.description,
      });
      
      setAccounts((prev) =>
        prev.map((account) =>
          account.id === updatedAccount.id ? updatedAccount : account
        )
      );
      
      setEditingAccount(null);
      
      toast({
        title: "Account Updated",
        description: `Account "${updatedAccount.name}" has been updated successfully.`
      });
      
      // Log user action
      await logUserAction({
        module: "accounting",
        action: "update_account",
        recordId: updatedAccount.id,
        metadata: { account_name: updatedAccount.name }
      });
    } catch (err) {
      console.error("Error updating account:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update account. Please try again."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!accountToDelete) return;
    
    try {
      setIsDeleting(true);
      await deleteAccount(accountToDelete.id);
      setAccounts((prev) => prev.filter((a) => a.id !== accountToDelete.id));
      
      toast({
        title: "Account Deleted",
        description: `Account "${accountToDelete.name}" has been deleted successfully.`
      });
      
      // Log user action
      await logUserAction({
        module: "accounting",
        action: "delete_account",
        recordId: accountToDelete.id,
        metadata: { account_name: accountToDelete.name }
      });
    } catch (err) {
      console.error("Error deleting account:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete account. Please try again."
      });
    } finally {
      setIsDeleting(false);
      setAccountToDelete(null);
    }
  };

  const handleAdjustBalance = async (values: { amount: string; description: string }) => {
    if (!accountToAdjust) return;
    
    try {
      setIsSubmitting(true);
      const amount = Number(values.amount);
      
      const updatedAccount = await adjustAccountBalance(
        accountToAdjust.id,
        amount,
        values.description
      );
      
      setAccounts((prev) =>
        prev.map((account) =>
          account.id === updatedAccount.id ? updatedAccount : account
        )
      );
      
      setAccountToAdjust(null);
      
      toast({
        title: "Balance Adjusted",
        description: `Account "${updatedAccount.name}" balance has been adjusted by $${Math.abs(amount).toFixed(2)}.`
      });
      
      // Log user action
      await logUserAction({
        module: "accounting",
        action: "adjust_account_balance",
        recordId: updatedAccount.id,
        metadata: { 
          account_name: updatedAccount.name,
          adjustment_amount: amount
        }
      });
    } catch (err) {
      console.error("Error adjusting account balance:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to adjust account balance. Please try again."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <AccountsHeader 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedType={selectedType}
        onTypeChange={setSelectedType}
        onRefresh={fetchAccounts}
        onNewAccount={() => setIsCreatingAccount(true)}
        loading={loading}
      />
      
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <AccountsTable 
        accounts={accounts}
        loading={loading}
        searchTerm={searchTerm}
        selectedType={selectedType}
        onEdit={setEditingAccount}
        onDelete={setAccountToDelete}
        onAdjustBalance={setAccountToAdjust}
      />
      
      {/* Dialogs */}
      <CreateAccountDialog 
        open={isCreatingAccount} 
        onOpenChange={setIsCreatingAccount}
        onSubmit={handleCreateSubmit}
        isSubmitting={isSubmitting}
      />
      
      <EditAccountDialog 
        account={editingAccount}
        onOpenChange={() => setEditingAccount(null)}
        onSubmit={handleEditSubmit}
        isSubmitting={isSubmitting}
      />
      
      <DeleteAccountDialog 
        account={accountToDelete}
        onConfirm={handleDeleteAccount}
        onCancel={() => setAccountToDelete(null)}
        isDeleting={isDeleting}
      />
      
      <AdjustBalanceDialog
        account={accountToAdjust}
        onOpenChange={() => setAccountToAdjust(null)}
        onSubmit={handleAdjustBalance}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
