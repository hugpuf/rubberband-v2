
import { useState, useEffect } from "react";
import { useAccounting } from "@/modules/accounting";
import { Transaction, TransactionLine, Account } from "@/modules/accounting/types";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Trash, Calendar, Check, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { TransactionStatusBadge } from "./TransactionStatusBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { EditTransactionDialog } from "./EditTransactionDialog";

interface TransactionDetailProps {
  transactionId: string;
  onBack: () => void;
}

export function TransactionDetail({ transactionId, onBack }: TransactionDetailProps) {
  const { getTransactionById, updateTransaction, deleteTransaction, getAccounts } = useAccounting();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchTransaction();
    fetchAccounts();
  }, [transactionId]);

  const fetchTransaction = async () => {
    setIsLoading(true);
    try {
      const fetchedTransaction = await getTransactionById(transactionId);
      
      if (fetchedTransaction) {
        setTransaction(fetchedTransaction);
      } else {
        toast({
          variant: "destructive",
          title: "Transaction not found",
          description: "The requested transaction could not be found"
        });
        onBack();
      }
    } catch (error) {
      console.error("Error fetching transaction:", error);
      toast({
        variant: "destructive",
        title: "Error loading transaction",
        description: "There was an error loading the transaction details"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAccounts = async () => {
    try {
      const fetchedAccounts = await getAccounts();
      setAccounts(fetchedAccounts);
    } catch (error) {
      console.error("Error fetching accounts:", error);
    }
  };

  const handleDeleteTransaction = async () => {
    if (!transaction) return;
    
    try {
      const success = await deleteTransaction(transaction.id);
      
      if (success) {
        toast({
          title: "Transaction deleted",
          description: "The transaction has been deleted"
        });
        onBack();
      } else {
        throw new Error("Failed to delete transaction");
      }
    } catch (error) {
      console.error("Error deleting transaction:", error);
      toast({
        variant: "destructive",
        title: "Delete failed",
        description: "Failed to delete the transaction"
      });
    }
  };

  const handleUpdateTransactionStatus = async (status: string) => {
    if (!transaction) return;
    
    try {
      const updatedTransaction = await updateTransaction(transaction.id, { status: status as any });
      
      if (updatedTransaction) {
        setTransaction(updatedTransaction);
        toast({
          title: "Status updated",
          description: `Transaction has been marked as ${status}`
        });
      } else {
        throw new Error("Failed to update transaction status");
      }
    } catch (error) {
      console.error("Error updating transaction status:", error);
      toast({
        variant: "destructive",
        title: "Update failed",
        description: "Failed to update transaction status"
      });
    }
  };

  const handleTransactionUpdated = (updatedTransaction: Transaction) => {
    setTransaction(updatedTransaction);
    setShowEditDialog(false);
  };

  // Find account names for each transaction line
  const getAccountName = (accountId: string): string => {
    const account = accounts.find(a => a.id === accountId);
    return account ? account.name : "Unknown Account";
  };

  // Check if transaction is balanced
  const isBalanced = (): boolean => {
    if (!transaction) return false;
    
    const totalDebits = transaction.lines.reduce((sum, line) => sum + line.debitAmount, 0);
    const totalCredits = transaction.lines.reduce((sum, line) => sum + line.creditAmount, 0);
    
    return Math.abs(totalDebits - totalCredits) < 0.01; // Allow for small rounding errors
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Loading transaction details...</p>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-muted-foreground">Transaction not found</p>
        <Button onClick={onBack} className="mt-4">Go Back</Button>
      </div>
    );
  }

  const totalDebits = transaction.lines.reduce((sum, line) => sum + line.debitAmount, 0);
  const totalCredits = transaction.lines.reduce((sum, line) => sum + line.creditAmount, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Transactions
          </Button>
          <h2 className="text-xl font-medium">Transaction Detail</h2>
          <TransactionStatusBadge status={transaction.status} />
          
          {!isBalanced() && (
            <div className="text-red-500 flex items-center">
              <X className="h-4 w-4 mr-1" />
              Unbalanced
            </div>
          )}
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={() => setShowEditDialog(true)} disabled={transaction.status === 'posted'}>
            <Edit className="mr-2 h-4 w-4" /> Edit
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash className="mr-2 h-4 w-4" /> Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete this transaction. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteTransaction}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Description</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">{transaction.description}</div>
            {transaction.referenceNumber && (
              <div className="text-sm text-muted-foreground mt-2">Ref: {transaction.referenceNumber}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Date & Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
              <span>Date: {new Date(transaction.date).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center">
              <span>Status: <TransactionStatusBadge status={transaction.status} /></span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Totals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between">
              <div>
                <div className="text-sm">Total Debits</div>
                <div className="text-lg font-bold">${totalDebits.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-sm">Total Credits</div>
                <div className="text-lg font-bold">${totalCredits.toFixed(2)}</div>
              </div>
            </div>
            {!isBalanced() && (
              <div className="mt-2 text-red-500 text-sm">
                Transaction is unbalanced by ${Math.abs(totalDebits - totalCredits).toFixed(2)}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transaction Lines</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Debit</TableHead>
                <TableHead className="text-right">Credit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transaction.lines.map((line: TransactionLine) => (
                <TableRow key={line.id}>
                  <TableCell>{getAccountName(line.accountId)}</TableCell>
                  <TableCell>{line.description || "-"}</TableCell>
                  <TableCell className="text-right">{line.debitAmount > 0 ? `$${line.debitAmount.toFixed(2)}` : "-"}</TableCell>
                  <TableCell className="text-right">{line.creditAmount > 0 ? `$${line.creditAmount.toFixed(2)}` : "-"}</TableCell>
                </TableRow>
              ))}
              <TableRow className="font-bold">
                <TableCell colSpan={2}>Total</TableCell>
                <TableCell className="text-right">${totalDebits.toFixed(2)}</TableCell>
                <TableCell className="text-right">${totalCredits.toFixed(2)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Status Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleUpdateTransactionStatus('draft')}
              disabled={transaction.status === 'draft'}
            >
              Mark as Draft
            </Button>
            <Button 
              variant="default" 
              size="sm" 
              onClick={() => handleUpdateTransactionStatus('posted')}
              disabled={transaction.status === 'posted' || !isBalanced()}
            >
              <Check className="mr-2 h-4 w-4" />
              Post Transaction
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleUpdateTransactionStatus('voided')}
              disabled={transaction.status === 'voided'}
            >
              Mark as Voided
            </Button>
          </div>
          {!isBalanced() && transaction.status !== 'posted' && (
            <p className="text-red-500 text-sm mt-2">
              Transaction must be balanced before it can be posted.
            </p>
          )}
        </CardContent>
      </Card>

      {transaction.status !== 'posted' && (
        <EditTransactionDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          transaction={transaction}
          accounts={accounts}
          onTransactionUpdated={handleTransactionUpdated}
        />
      )}
    </div>
  );
}
