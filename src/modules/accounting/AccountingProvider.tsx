
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

  // Initialize the module when the organization is loaded
  useEffect(() => {
    if (organization?.id && !state.isInitialized) {
      initializeModule();
    }
  }, [organization?.id]);

  const initializeModule = async () => {
    if (!organization?.id) return;
    
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      // Fetch accounting configuration
      const config = await accountingApi.getAccountingConfig(organization.id);
      
      // Fetch accounts
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
      
      // Update local state
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

  // Account operations
  const getAccounts = async () => {
    if (!organization?.id) return [];
    
    try {
      const accounts = await accountingApi.fetchAccounts(organization.id);
      
      // Update accounts in state
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
    
    // Update accounts in state
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
    
    // Update accounts in state
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
    
    // Remove account from state or mark as inactive
    setState(prev => ({
      ...prev,
      accounts: prev.accounts.filter(account => account.id !== id)
    }));
    
    toast({
      title: "Account deleted",
      description: "The account has been deleted."
    });
  };
  
  // Transaction operations
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
    
    // Refresh accounts to update balances
    await getAccounts();
    
    return newTransaction;
  };
  
  // Invoice operations
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
    // Placeholder - will be implemented in Phase 4
    const newInvoice: Invoice = {
      ...invoice,
      id: `temp-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    return newInvoice;
  };
  
  const updateInvoice = async (id: string, updates: Partial<Invoice>) => {
    // Placeholder - will be implemented in Phase 4
    // Fix: Explicitly cast the status to the correct type
    const updatedInvoice: Invoice = {
      id,
      invoiceNumber: '',
      customerId: '',
      customerName: '',
      issueDate: '',
      dueDate: '',
      items: [],
      subtotal: 0,
      taxAmount: 0,
      total: 0,
      status: 'draft', // Explicitly use a valid status value
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...updates
    };
    
    return updatedInvoice;
  };
  
  // Bill operations
  const getBills = async () => {
    if (!organization?.id) return [];
    
    try {
      // Placeholder for fetchBills function
      return [] as Bill[];
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
    // Placeholder - will be implemented in Phase 4
    const newBill: Bill = {
      ...bill,
      id: `temp-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    return newBill;
  };
  
  const updateBill = async (id: string, updates: Partial<Bill>) => {
    // Placeholder - will be implemented in Phase 4
    const updatedBill: Bill = {
      id,
      billNumber: '',
      vendorId: '',
      vendorName: '',
      issueDate: '',
      dueDate: '',
      items: [],
      subtotal: 0,
      taxAmount: 0,
      total: 0,
      status: 'draft', // Explicitly use a valid status value
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...updates
    };
    
    return updatedBill;
  };
  
  // Payroll operations
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
  
  // Cross-module integration
  const getCustomerBalance = async (customerId: string) => {
    return accountingApi.getCustomerBalance(customerId);
  };
  
  const getVendorBalance = async (vendorId: string) => {
    return accountingApi.getVendorBalance(vendorId);
  };

  const contextValue = {
    state,
    initializeModule,
    updateModuleConfig,
    getAccounts,
    createAccount,
    updateAccount,
    deleteAccount,
    createTransaction,
    getInvoices,
    createInvoice,
    updateInvoice,
    getBills,
    createBill,
    updateBill,
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
