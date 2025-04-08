import { ReactNode, useState, useEffect } from "react";
import { useOrganization } from "@/hooks/useOrganization";
import { useToast } from "@/hooks/use-toast";
import { AccountingContext } from "./accountingContext";
import { 
  AccountingModuleState, 
  AccountingModuleConfig, 
  Account, 
  Transaction, 
  TransactionLine,
  Invoice, 
  Bill,
  PayrollRun,
  PayrollItem
} from "./types";
import * as accountingApi from "./api";

const initialState: AccountingModuleState = {
  isLoading: true,
  isError: false,
  config: null,
  accounts: [],
  isInitialized: false
};

export function AccountingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AccountingModuleState>(initialState);
  const { organization } = useOrganization();
  const { toast } = useToast();

  useEffect(() => {
    if (organization?.id && !state.isInitialized) {
      initializeModule();
    }
  }, [organization?.id]);

  const initializeModule = async () => {
    if (!organization?.id) return;
    
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const config = await accountingApi.getAccountingConfig(organization.id);
      
      const accounts = await accountingApi.fetchAccounts(organization.id);
      
      setState({
        isLoading: false,
        isError: false,
        config,
        accounts,
        isInitialized: true
      });
    } catch (error) {
      console.error("Error initializing accounting module:", error);
      setState(prev => ({ 
        ...prev,
        isLoading: false,
        isError: true 
      }));
      
      toast({
        variant: "destructive",
        title: "Error loading accounting module",
        description: "There was a problem loading the accounting module. Please try again later."
      });
    }
  };

  const updateModuleConfig = async (configUpdates: Partial<AccountingModuleConfig>) => {
    if (!organization?.id) return;
    
    try {
      await accountingApi.updateAccountingConfig(organization.id, configUpdates);
      
      setState(prev => ({
        ...prev,
        config: prev.config ? { ...prev.config, ...configUpdates } : null
      }));
      
      toast({
        title: "Configuration updated",
        description: "Accounting module configuration has been updated."
      });
    } catch (error) {
      console.error("Error updating module config:", error);
      toast({
        variant: "destructive",
        title: "Update failed",
        description: "Failed to update accounting configuration."
      });
    }
  };

  const getAccounts = async () => {
    if (!organization?.id) return [];
    
    try {
      const accounts = await accountingApi.fetchAccounts(organization.id);
      
      setState(prev => ({
        ...prev,
        accounts
      }));
      
      return accounts;
    } catch (error) {
      console.error("Error fetching accounts:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch accounts."
      });
      return [];
    }
  };
  
  const createAccount = async (accountData: Omit<Account, 'id' | 'createdAt' | 'updatedAt' | 'balance'>) => {
    if (!organization?.id) throw new Error("Organization not found");
    
    const newAccount = await accountingApi.createAccount(organization.id, accountData);
    
    if (!newAccount) {
      throw new Error("Failed to create account");
    }
    
    setState(prev => ({
      ...prev,
      accounts: [...prev.accounts, newAccount]
    }));
    
    toast({
      title: "Account created",
      description: `Account "${newAccount.name}" has been created.`
    });
    
    return newAccount;
  };
  
  const updateAccount = async (id: string, updates: Partial<Account>) => {
    const updatedAccount = await accountingApi.updateAccount(id, updates);
    
    if (!updatedAccount) {
      throw new Error("Failed to update account");
    }
    
    setState(prev => ({
      ...prev,
      accounts: prev.accounts.map(account => 
        account.id === updatedAccount.id ? updatedAccount : account
      )
    }));
    
    toast({
      title: "Account updated",
      description: `Account "${updatedAccount.name}" has been updated.`
    });
    
    return updatedAccount;
  };
  
  const deleteAccount = async (id: string) => {
    const success = await accountingApi.deleteAccount(id);
    
    if (!success) {
      throw new Error("Failed to delete account");
    }
    
    setState(prev => ({
      ...prev,
      accounts: prev.accounts.filter(account => account.id !== id)
    }));
    
    toast({
      title: "Account deleted",
      description: "The account has been deleted."
    });
  };
  
  const createTransaction = async (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!organization?.id) throw new Error("Organization not found");
    
    const userId = organization.id; // This is a placeholder, should be the authenticated user's ID
    
    const newTransaction = await accountingApi.createTransaction(
      organization.id,
      userId,
      transaction as any
    );
    
    if (!newTransaction) {
      throw new Error("Failed to create transaction");
    }
    
    toast({
      title: "Transaction created",
      description: `Transaction has been recorded.`
    });
    
    await getAccounts();
    
    return newTransaction;
  };
  
  const fetchTransactions = async (filters?: {
    startDate?: string;
    endDate?: string;
    status?: string;
    search?: string;
  }) => {
    if (!organization?.id) return [];
    
    try {
      return await accountingApi.fetchTransactions(organization.id, filters);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch transactions."
      });
      return [];
    }
  };
  
  const getTransactionById = async (id: string) => {
    try {
      return await accountingApi.getTransactionById(id);
    } catch (error) {
      console.error("Error fetching transaction by ID:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch transaction details."
      });
      return null;
    }
  };
  
  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    try {
      const updatedTransaction = await accountingApi.updateTransaction(id, updates);
      
      if (!updatedTransaction) {
        throw new Error("Failed to update transaction");
      }
      
      toast({
        title: "Transaction updated",
        description: "The transaction has been updated."
      });
      
      return updatedTransaction;
    } catch (error) {
      console.error("Error updating transaction:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update transaction."
      });
      return null;
    }
  };
  
  const deleteTransaction = async (id: string) => {
    try {
      const success = await accountingApi.deleteTransaction(id);
      
      if (!success) {
        throw new Error("Failed to delete transaction");
      }
      
      toast({
        title: "Transaction deleted",
        description: "The transaction has been deleted."
      });
      
      return true;
    } catch (error) {
      console.error("Error deleting transaction:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete transaction."
      });
      return false;
    }
  };
  
  const getInvoices = async () => {
    if (!organization?.id) return [];
    
    try {
      return await accountingApi.fetchInvoices(organization.id);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch invoices."
      });
      return [];
    }
  };
  
  const createInvoice = async (invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!organization?.id) throw new Error("Organization not found");
    
    try {
      const newInvoice = await accountingApi.createInvoice(organization.id, invoice);
      
      if (!newInvoice) {
        throw new Error("Failed to create invoice");
      }
      
      toast({
        title: "Invoice created",
        description: `Invoice ${newInvoice.invoiceNumber} has been created.`
      });
      
      return newInvoice;
    } catch (error) {
      console.error("Error creating invoice:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create invoice."
      });
      throw error;
    }
  };
  
  const updateInvoice = async (id: string, updates: Partial<Invoice>) => {
    try {
      const updatedInvoice = await accountingApi.updateExistingInvoice(id, updates);
      
      if (!updatedInvoice) {
        throw new Error("Failed to update invoice");
      }
      
      toast({
        title: "Invoice updated",
        description: `Invoice ${updatedInvoice.invoiceNumber} has been updated.`
      });
      
      return updatedInvoice;
    } catch (error) {
      console.error("Error updating invoice:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update invoice."
      });
      throw error;
    }
  };
  
  const deleteInvoice = async (id: string) => {
    try {
      const success = await accountingApi.deleteInvoice(id);
      
      if (!success) {
        throw new Error("Failed to delete invoice");
      }
      
      toast({
        title: "Invoice deleted",
        description: "The invoice has been deleted."
      });
    } catch (error) {
      console.error("Error deleting invoice:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete invoice."
      });
      throw error;
    }
  };
  
  const getBills = async () => {
    if (!organization?.id) return [];
    
    try {
      return await accountingApi.fetchBills(organization.id);
    } catch (error) {
      console.error("Error fetching bills:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch bills."
      });
      return [];
    }
  };
  
  const createBill = async (bill: Omit<Bill, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!organization?.id) throw new Error("Organization not found");
    
    try {
      const newBill = await accountingApi.createBill(organization.id, bill);
      
      if (!newBill) {
        throw new Error("Failed to create bill");
      }
      
      toast({
        title: "Bill created",
        description: `Bill ${newBill.billNumber} has been created.`
      });
      
      return newBill;
    } catch (error) {
      console.error("Error creating bill:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create bill."
      });
      throw error;
    }
  };
  
  const updateBill = async (id: string, updates: Partial<Bill>) => {
    if (!organization?.id) throw new Error("Organization not found");
    
    try {
      const updatedBill = await accountingApi.updateExistingBill(id, updates);
      
      if (!updatedBill) {
        throw new Error("Failed to update bill");
      }
      
      toast({
        title: "Bill updated",
        description: `Bill ${updatedBill.billNumber} has been updated.`
      });
      
      return updatedBill;
    } catch (error) {
      console.error("Error updating bill:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update bill."
      });
      throw error;
    }
  };
  
  const deleteBill = async (id: string) => {
    try {
      const success = await accountingApi.deleteBill(id);
      
      if (!success) {
        throw new Error("Failed to delete bill");
      }
      
      toast({
        title: "Bill deleted",
        description: "The bill has been deleted."
      });
      
      return true;
    } catch (error) {
      console.error("Error deleting bill:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete bill."
      });
      throw error;
    }
  };
  
  const getPayrollRuns = async () => {
    if (!organization?.id) return [];
    
    try {
      return await accountingApi.fetchPayrollRuns(organization.id);
    } catch (error) {
      console.error("Error fetching payroll runs:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch payroll runs."
      });
      return [];
    }
  };
  
  const getCustomerBalance = async (customerId: string) => {
    return accountingApi.getCustomerBalance(customerId);
  };
  
  const getVendorBalance = async (vendorId: string) => {
    return accountingApi.getVendorBalance(vendorId);
  };

  const adjustAccountBalance = async (
    accountId: string,
    amount: number,
    description: string
  ) => {
    if (!organization?.id) throw new Error("Organization not found");
    
    try {
      const userId = organization.id; // This is a placeholder, should be the authenticated user's ID
      
      const updatedAccount = await accountingApi.adjustAccountBalance(
        organization.id,
        userId,
        accountId,
        amount,
        description
      );
      
      if (!updatedAccount) {
        throw new Error("Failed to adjust account balance");
      }
      
      setState(prev => ({
        ...prev,
        accounts: prev.accounts.map(account => 
          account.id === updatedAccount.id ? updatedAccount : account
        )
      }));
      
      toast({
        title: "Balance adjusted",
        description: `Account "${updatedAccount.name}" balance has been adjusted.`
      });
      
      return updatedAccount;
    } catch (error) {
      console.error("Error adjusting account balance:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to adjust account balance."
      });
      throw error;
    }
  };

  const contextValue = {
    state,
    initializeModule,
    updateModuleConfig,
    getAccounts,
    createAccount,
    updateAccount,
    deleteAccount,
    adjustAccountBalance,
    createTransaction,
    fetchTransactions,
    getTransactionById,
    updateTransaction,
    deleteTransaction,
    getInvoices,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    getBills,
    createBill,
    updateBill,
    deleteBill,
    getPayrollRuns,
    getCustomerBalance,
    getVendorBalance
  };

  return (
    <AccountingContext.Provider value={contextValue}>
      {children}
    </AccountingContext.Provider>
  );
}
