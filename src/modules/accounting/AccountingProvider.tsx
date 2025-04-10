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
  PayrollItem,
  CreatePayrollRunParams,
  UpdatePayrollRunParams,
  PayrollRunFilterParams,
  CreatePayrollItemParams,
  UpdatePayrollItemParams,
  PayrollItemFilterParams,
  PaginatedResponse
} from "./types";
import * as accountingApi from "./api";
import payrollService from "./services/payroll/SupabasePayrollService";

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
      
      const accounts = await accountingApi.getAccounts();
      
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
      const updatedConfig = await accountingApi.updateAccountingConfig(organization.id, configUpdates);
      
      setState(prev => ({
        ...prev,
        config: updatedConfig
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
      const accounts = await accountingApi.getAccounts();
      
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
    try {
      const newAccount = await accountingApi.createAccount(accountData);
      
      setState(prev => ({
        ...prev,
        accounts: [...prev.accounts, newAccount]
      }));
      
      toast({
        title: "Account created",
        description: `Account "${newAccount.name}" has been created.`
      });
      
      return newAccount;
    } catch (error) {
      console.error("Error creating account:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create account."
      });
      throw error;
    }
  };
  
  const updateAccount = async (id: string, updates: Partial<Account>) => {
    try {
      const updatedAccount = await accountingApi.updateAccount(id, updates);
      
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
    } catch (error) {
      console.error("Error updating account:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update account."
      });
      throw error;
    }
  };
  
  const deleteAccount = async (id: string) => {
    try {
      const success = await accountingApi.deleteAccount(id);
      
      if (success) {
        setState(prev => ({
          ...prev,
          accounts: prev.accounts.filter(account => account.id !== id)
        }));
        
        toast({
          title: "Account deleted",
          description: "The account has been deleted."
        });
      }
      
      return success;
    } catch (error) {
      console.error("Error deleting account:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete account."
      });
      throw error;
    }
  };
  
  const createTransaction = async (transaction: Omit<Transaction, "id" | "createdAt" | "updatedAt">) => {
    try {
      if (!organization?.id) {
        throw new Error("Organization ID is required to create a transaction");
      }
      
      const newTransaction = await accountingApi.createTransaction({
        ...transaction,
        organization_id: organization.id
      });
      
      if (!newTransaction) {
        throw new Error("Failed to create transaction");
      }
      
      toast({
        title: "Transaction created",
        description: `Transaction has been recorded.`
      });
      
      await getAccounts();
      
      return newTransaction;
    } catch (error) {
      console.error("Error creating transaction:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create transaction."
      });
      throw error;
    }
  };
  
  const fetchTransactions = async (filters?: { 
    startDate?: string; 
    endDate?: string; 
    status?: string; 
    search?: string;
  }): Promise<Transaction[]> => {
    try {
      return await accountingApi.fetchTransactions(filters);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw error;
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
      
      toast({
        title: "Transaction deleted",
        description: "The transaction has been deleted."
      });
      
      return success;
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
      return await accountingApi.getInvoices();
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
    try {
      const newInvoice = await accountingApi.createInvoice(invoice);
      
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
  
  const updateInvoice = async (id: string, updates: Partial<Invoice>): Promise<Invoice> => {
    try {
      const result = await accountingApi.updateInvoice(id, updates);
      console.log('Invoice updated successfully:', result);
      
      toast({
        title: "Invoice updated",
        description: `Invoice has been updated successfully.`
      });
      
      return result;
    } catch (error) {
      console.error('Error updating invoice:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update invoice."
      });
      throw error;
    }
  };
  
  const deleteInvoice = async (id: string): Promise<boolean> => {
    try {
      const success = await accountingApi.deleteInvoice(id);
      console.log('Invoice deletion result:', success);
      
      if (success) {
        toast({
          title: "Invoice deleted",
          description: "The invoice has been deleted successfully."
        });
      }
      
      return success;
    } catch (error) {
      console.error('Error deleting invoice:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete invoice."
      });
      throw error;
    }
  };
  
  const getBills = async () => {
    if (!organization?.id) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Organization not found. Please refresh the page or contact support."
      });
      return [];
    }
    
    try {
      const bills = await accountingApi.getBills();
      return bills;
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
    if (!organization?.id) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Organization not found. Please refresh the page or contact support."
      });
      throw new Error("Organization not found");
    }
    
    try {
      const newBill = await accountingApi.createBill({
        ...bill,
        organization_id: organization.id
      });
      
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
  
  const updateBill = async (id: string, updates: Partial<Bill>): Promise<Bill> => {
    try {
      const result = await accountingApi.updateBill(id, updates);
      console.log('Bill updated successfully:', result);
      
      return result;
    } catch (error) {
      console.error('Error updating bill:', error);
      throw error;
    }
  };
  
  const deleteBill = async (id: string): Promise<boolean> => {
    try {
      const success = await accountingApi.deleteBill(id);
      console.log('Bill deletion result:', success);
      
      if (success) {
        toast({
          title: "Bill deleted",
          description: "The bill has been deleted successfully."
        });
      }
      
      return success;
    } catch (error) {
      console.error('Error deleting bill:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete bill."
      });
      throw error;
    }
  };
  
  const getPayrollRuns = async (filters?: PayrollRunFilterParams): Promise<PaginatedResponse<PayrollRun>> => {
    if (!organization?.id) {
      return {
        data: [],
        total: 0,
        page: filters?.page || 1,
        limit: filters?.limit || 10,
        hasMore: false
      };
    }
    
    try {
      return await payrollService.getPayrollRuns(filters);
    } catch (error) {
      console.error("Error fetching payroll runs:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch payroll runs."
      });
      return {
        data: [],
        total: 0,
        page: filters?.page || 1,
        limit: filters?.limit || 10,
        hasMore: false
      };
    }
  };
  
  const getPayrollRunById = async (id: string): Promise<PayrollRun | null> => {
    try {
      return await payrollService.getPayrollRunById(id);
    } catch (error) {
      console.error("Error fetching payroll run:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch payroll run details."
      });
      return null;
    }
  };
  
  const createPayrollRun = async (params: CreatePayrollRunParams): Promise<PayrollRun> => {
    if (!organization?.id) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Organization not found. Please refresh the page or contact support."
      });
      throw new Error("Organization not found");
    }
    
    try {
      const newPayrollRun = await payrollService.createPayrollRun({
        ...params,
        organization_id: organization.id
      });
      
      toast({
        title: "Payroll run created",
        description: `Payroll run "${newPayrollRun.name}" has been created.`
      });
      
      return newPayrollRun;
    } catch (error) {
      console.error("Error creating payroll run:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create payroll run."
      });
      throw error;
    }
  };
  
  const updatePayrollRun = async (id: string, updates: UpdatePayrollRunParams): Promise<PayrollRun> => {
    try {
      const updatedPayrollRun = await payrollService.updatePayrollRun(id, updates);
      
      toast({
        title: "Payroll run updated",
        description: `Payroll run "${updatedPayrollRun.name}" has been updated.`
      });
      
      return updatedPayrollRun;
    } catch (error) {
      console.error("Error updating payroll run:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update payroll run."
      });
      throw error;
    }
  };
  
  const deletePayrollRun = async (id: string): Promise<boolean> => {
    try {
      const success = await payrollService.deletePayrollRun(id);
      
      if (success) {
        toast({
          title: "Payroll run deleted",
          description: "The payroll run has been deleted."
        });
      }
      
      return success;
    } catch (error) {
      console.error("Error deleting payroll run:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete payroll run."
      });
      throw error;
    }
  };
  
  const processPayrollRun = async (id: string): Promise<PayrollRun> => {
    try {
      const processedRun = await payrollService.processPayrollRun(id);
      
      toast({
        title: "Payroll run processed",
        description: `Payroll run "${processedRun.name}" has been processed.`
      });
      
      return processedRun;
    } catch (error) {
      console.error("Error processing payroll run:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to process payroll run."
      });
      throw error;
    }
  };
  
  const finalizePayrollRun = async (id: string): Promise<PayrollRun> => {
    try {
      const finalizedRun = await payrollService.finalizePayrollRun(id);
      
      toast({
        title: "Payroll run finalized",
        description: `Payroll run "${finalizedRun.name}" has been finalized.`
      });
      
      return finalizedRun;
    } catch (error) {
      console.error("Error finalizing payroll run:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to finalize payroll run."
      });
      throw error;
    }
  };
  
  const getPayrollItems = async (filters?: PayrollItemFilterParams): Promise<PaginatedResponse<PayrollItem>> => {
    try {
      return await payrollService.getPayrollItems(filters);
    } catch (error) {
      console.error("Error fetching payroll items:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch payroll items."
      });
      return {
        data: [],
        total: 0,
        page: filters?.page || 1,
        limit: filters?.limit || 10,
        hasMore: false
      };
    }
  };
  
  const getPayrollItemById = async (id: string): Promise<PayrollItem | null> => {
    try {
      return await payrollService.getPayrollItemById(id);
    } catch (error) {
      console.error("Error fetching payroll item:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch payroll item details."
      });
      return null;
    }
  };
  
  const getPayrollItemsByRunId = async (runId: string): Promise<PayrollItem[]> => {
    try {
      return await payrollService.getPayrollItemsByRunId(runId);
    } catch (error) {
      console.error("Error fetching payroll items:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch payroll items."
      });
      return [];
    }
  };
  
  const createPayrollItem = async (params: CreatePayrollItemParams): Promise<PayrollItem> => {
    try {
      const newPayrollItem = await payrollService.createPayrollItem(params);
      
      toast({
        title: "Payroll item created",
        description: "Payroll item has been created."
      });
      
      return newPayrollItem;
    } catch (error) {
      console.error("Error creating payroll item:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create payroll item."
      });
      throw error;
    }
  };
  
  const updatePayrollItem = async (id: string, updates: UpdatePayrollItemParams): Promise<PayrollItem> => {
    try {
      const updatedPayrollItem = await payrollService.updatePayrollItem(id, updates);
      
      toast({
        title: "Payroll item updated",
        description: "Payroll item has been updated."
      });
      
      return updatedPayrollItem;
    } catch (error) {
      console.error("Error updating payroll item:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update payroll item."
      });
      throw error;
    }
  };
  
  const deletePayrollItem = async (id: string): Promise<boolean> => {
    try {
      const success = await payrollService.deletePayrollItem(id);
      
      if (success) {
        toast({
          title: "Payroll item deleted",
          description: "The payroll item has been deleted."
        });
      }
      
      return success;
    } catch (error) {
      console.error("Error deleting payroll item:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete payroll item."
      });
      throw error;
    }
  };
  
  const exportPayrollRun = async (id: string, format: 'csv' | 'pdf' | 'json'): Promise<string> => {
    try {
      const exportData = await payrollService.exportPayrollRun(id, format);
      
      toast({
        title: "Payroll run exported",
        description: `Payroll run has been exported in ${format.toUpperCase()} format.`
      });
      
      return exportData;
    } catch (error) {
      console.error("Error exporting payroll run:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to export payroll run."
      });
      throw error;
    }
  };

  const adjustAccountBalance = async (accountId: string, amount: number, description: string) => {
    try {
      console.log(`Adjusting account ${accountId} by ${amount}: ${description}`);
      return {} as Account;
    } catch (error) {
      console.error("Error adjusting account balance:", error);
      throw error;
    }
  };

  const getCustomerBalance = async (customerId: string) => {
    try {
      console.log(`Getting balance for customer ${customerId}`);
      return 0;
    } catch (error) {
      console.error("Error getting customer balance:", error);
      return 0;
    }
  };

  const getVendorBalance = async (vendorId: string) => {
    try {
      console.log(`Getting balance for vendor ${vendorId}`);
      return 0;
    } catch (error) {
      console.error("Error getting vendor balance:", error);
      return 0;
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
    getPayrollRunById,
    createPayrollRun,
    updatePayrollRun,
    deletePayrollRun,
    processPayrollRun,
    finalizePayrollRun,
    getPayrollItems,
    getPayrollItemById,
    getPayrollItemsByRunId,
    createPayrollItem,
    updatePayrollItem,
    deletePayrollItem,
    exportPayrollRun,
    getCustomerBalance,
    getVendorBalance
  };

  return (
    <AccountingContext.Provider value={contextValue}>
      {children}
    </AccountingContext.Provider>
  );
}
