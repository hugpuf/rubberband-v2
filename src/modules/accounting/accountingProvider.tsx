
import React, { useState, useEffect, ReactNode } from "react";
import { AccountingContext } from "./accountingContext";
import { AccountingModuleState, AccountingModuleConfig, Account, Transaction, Invoice, Bill, PayrollRun } from "./types";
import * as api from "./api";
import InvoiceService from "./services/InvoiceService";
import TransactionService from "./services/TransactionService";

interface AccountingProviderProps {
  children: ReactNode;
}

export const AccountingProvider: React.FC<AccountingProviderProps> = ({ children }) => {
  const [state, setState] = useState<AccountingModuleState>({
    isLoading: true,
    isError: false,
    config: null,
    accounts: [],
    isInitialized: false,
  });

  // Initialize the module
  const initializeModule = async () => {
    try {
      setState(prevState => ({
        ...prevState,
        isLoading: true,
      }));

      // Fetch accounts as a basic initialization step
      const accounts = await getAccounts();

      setState(prevState => ({
        ...prevState,
        accounts,
        isLoading: false,
        isInitialized: true,
        config: {
          defaultCurrency: "USD",
          fiscalYearStart: "01-01",
          taxRate: 10,
          isEnabled: true,
        },
      }));
    } catch (error) {
      console.error("Failed to initialize accounting module:", error);
      setState(prevState => ({
        ...prevState,
        isLoading: false,
        isError: true,
      }));
    }
  };

  useEffect(() => {
    // Auto-initialize on mount if not already initialized
    if (!state.isInitialized && !state.isLoading) {
      initializeModule();
    }
  }, [state.isInitialized, state.isLoading]);

  // Module configuration functions
  const updateModuleConfig = async (config: Partial<AccountingModuleConfig>) => {
    setState(prevState => ({
      ...prevState,
      config: { ...prevState.config!, ...config },
    }));
    // In a real implementation, we'd persist this to the database
  };

  // Account operations
  const getAccounts = async (): Promise<Account[]> => {
    return api.getAccounts();
  };

  const createAccount = async (account: Omit<Account, 'id' | 'createdAt' | 'updatedAt' | 'balance'>): Promise<Account> => {
    return api.createAccount(account);
  };

  const updateAccount = async (id: string, updates: Partial<Account>): Promise<Account> => {
    return api.updateAccount(id, updates);
  };

  const deleteAccount = async (id: string): Promise<boolean> => {
    return api.deleteAccount(id);
  };

  const adjustAccountBalance = async (accountId: string, amount: number, description: string): Promise<Account> => {
    // This would normally create a transaction that affects the account's balance
    // For now, we'll just return a mocked account
    return {
      id: accountId,
      code: "1000",
      name: "Cash",
      type: "asset",
      description: "Cash account",
      isActive: true,
      balance: 1000 + amount,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  };

  // Transaction operations - using the new service
  const createTransaction = async (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<Transaction> => {
    // Add organization ID - in a real app, this would come from the auth context
    const txn = {
      ...transaction,
      organization_id: "test-org-id"
    };
    return TransactionService.createTransaction(txn);
  };

  const fetchTransactions = async (filters?: { startDate?: string; endDate?: string; status?: string; search?: string; }): Promise<Transaction[]> => {
    return TransactionService.getTransactions(filters);
  };

  const getTransactionById = async (id: string): Promise<Transaction | null> => {
    return TransactionService.getTransactionById(id);
  };

  const updateTransaction = async (id: string, updates: Partial<Transaction>): Promise<Transaction | null> => {
    return TransactionService.updateTransaction(id, updates);
  };

  const deleteTransaction = async (id: string): Promise<boolean> => {
    return TransactionService.deleteTransaction(id);
  };

  // Invoice operations - using the InvoiceService
  const getInvoices = async (): Promise<Invoice[]> => {
    return InvoiceService.getInvoices();
  };

  const createInvoice = async (invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>): Promise<Invoice> => {
    // Add organization ID - in a real app, this would come from the auth context
    const inv = {
      ...invoice,
      organization_id: "test-org-id"
    };
    return api.createInvoice(inv);
  };

  const updateInvoice = async (id: string, updates: Partial<Invoice>): Promise<Invoice> => {
    return api.updateInvoice(id, updates);
  };

  const deleteInvoice = async (id: string): Promise<boolean> => {
    return api.deleteInvoice(id);
  };

  // Bill operations
  const getBills = async (): Promise<Bill[]> => {
    return [];
  };

  const createBill = async (bill: Omit<Bill, 'id' | 'createdAt' | 'updatedAt'>): Promise<Bill> => {
    return {} as Bill;
  };

  const updateBill = async (id: string, updates: Partial<Bill>): Promise<Bill> => {
    return {} as Bill;
  };

  const deleteBill = async (id: string): Promise<boolean> => {
    return true;
  };

  // Payroll operations
  const getPayrollRuns = async (): Promise<PayrollRun[]> => {
    return [];
  };

  // Cross-module integration
  const getCustomerBalance = async (customerId: string): Promise<number> => {
    return 0;
  };

  const getVendorBalance = async (vendorId: string): Promise<number> => {
    return 0;
  };

  return (
    <AccountingContext.Provider
      value={{
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
        getVendorBalance,
      }}
    >
      {children}
    </AccountingContext.Provider>
  );
};

export default AccountingProvider;
