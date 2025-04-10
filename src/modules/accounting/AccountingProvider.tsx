import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { useUser } from '@supabase/auth-helpers-react';

import {
  AccountingModuleConfig,
  Account,
  Transaction,
  Invoice,
  Bill,
  PayrollItem,
  PayrollRun,
  TransactionFilterParams,
} from './types';
import { createServices } from './api';
import { Database } from '@/integrations/supabase/types';

// Define the context type
type AccountingContextType = {
  state: {
    isLoading: boolean;
    isError: boolean;
    config: AccountingModuleConfig | null;
    accounts: Account[];
    transactions: Transaction[];
    invoices: Invoice[];
    bills: Bill[];
    payrolls: {
      items: PayrollItem[];
      runs: PayrollRun[];
    };
    isInitialized: boolean;
  };
  getModuleConfig: () => Promise<AccountingModuleConfig | null>;
  getAccounts: () => Promise<Account[]>;
  createAccount: (account: Omit<Account, 'id' | 'createdAt' | 'updatedAt' | 'balance'>) => Promise<Account>;
  updateAccount: (id: string, updates: Partial<Account>) => Promise<Account>;
  deleteAccount: (id: string) => Promise<boolean>;
  adjustAccountBalance: (accountId: string, amount: number) => Promise<boolean>;
  getTransactions: (filters?: TransactionFilterParams) => Promise<Transaction[]>;
  createTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'> & { organization_id: string }) => Promise<Transaction>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<Transaction>;
  deleteTransaction: (id: string) => Promise<boolean>;
  getInvoices: () => Promise<Invoice[]>;
  createInvoice: (invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Invoice>;
  updateInvoice: (id: string, updates: Partial<Invoice>) => Promise<Invoice>;
  deleteInvoice: (id: string) => Promise<boolean>;
  getBills: () => Promise<Bill[]>;
  createBill: (bill: Omit<Bill, 'id' | 'createdAt' | 'updatedAt'> & { organization_id: string }) => Promise<Bill>;
  updateBill: (id: string, updates: Partial<Bill>) => Promise<Bill>;
  deleteBill: (id: string) => Promise<boolean>;
  getPayrollItems: () => Promise<PayrollItem[]>;
  createPayrollItem: (item: Omit<PayrollItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<PayrollItem>;
  updatePayrollItem: (id: string, updates: Partial<PayrollItem>) => Promise<PayrollItem>;
  deletePayrollItem: (id: string) => Promise<boolean>;
  getPayrollRuns: () => Promise<PayrollRun[]>;
  createPayrollRun: (run: Omit<PayrollRun, 'id' | 'createdAt' | 'updatedAt'>) => Promise<PayrollRun>;
  updatePayrollRun: (id: string, updates: Partial<PayrollRun>) => Promise<PayrollRun>;
  deletePayrollRun: (id: string) => Promise<boolean>;
};

// Create the context
const AccountingContext = createContext<AccountingContextType | undefined>(
  undefined
);

// Hook for using the context
export const useAccounting = (): AccountingContextType => {
  const context = useContext(AccountingContext);
  if (!context) {
    throw new Error(
      'useAccounting must be used within an AccountingProvider'
    );
  }
  return context;
};

// Define the provider props
type AccountingProviderProps = {
  supabase: SupabaseClient<Database>;
  children: React.ReactNode;
};

export function AccountingProvider({ children, supabase }: AccountingProviderProps): JSX.Element {
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [config, setConfig] = useState<AccountingModuleConfig | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [payrollItems, setPayrollItems] = useState<PayrollItem[]>([]);
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const user = useUser();
  const organizationId = user?.id || ''; // In a real application, this would come from the user's organization
  
  useEffect(() => {
    // Ensure we have an organization ID
    if (!organizationId) {
      console.error('No organization ID available');
      return;
    }
    
    // Initialize services with the organization ID
    const services = createServices(supabase, organizationId);
    const {
      accountService,
      transactionService,
    } = services;
    
    setIsLoading(true);
    Promise.all([
      accountService.getAccounts(),
      transactionService.getTransactions(),
    ])
    .then(([accounts, transactions]) => {
      setAccounts(accounts);
      setTransactions(transactions);
      setIsInitialized(true);
    })
    .catch((error) => {
      console.error("Error initializing accounting module:", error);
      setIsError(true);
    })
    .finally(() => {
      setIsLoading(false);
    });
  }, [organizationId, supabase]);
  
  const getModuleConfig = useCallback(async () => {
    // TODO: Implement fetching module config from Supabase
    return {
      defaultCurrency: 'USD',
      fiscalYearStart: '2023-01-01',
      taxRate: 0.0825,
      isEnabled: true,
    };
  }, []);

  const getAccounts = useCallback(async () => {
    if (!organizationId) {
      console.error('No organization ID available');
      return [];
    }
    const services = createServices(supabase, organizationId);
    return await services.accountService.getAccounts();
  }, [supabase, organizationId]);

  const createAccount = useCallback(
    async (account: Omit<Account, 'id' | 'createdAt' | 'updatedAt' | 'balance'>) => {
      if (!organizationId) {
        console.error('No organization ID available');
        throw new Error('Organization ID is required');
      }
      const services = createServices(supabase, organizationId);
      return await services.accountService.createAccount(account);
    },
    [supabase, organizationId]
  );

  const updateAccount = useCallback(
    async (id: string, updates: Partial<Account>) => {
      if (!organizationId) {
        console.error('No organization ID available');
        throw new Error('Organization ID is required');
      }
      const services = createServices(supabase, organizationId);
      return await services.accountService.updateAccount(id, updates);
    },
    [supabase, organizationId]
  );

  const deleteAccount = useCallback(async (id: string) => {
    if (!organizationId) {
      console.error('No organization ID available');
      return false;
    }
    const services = createServices(supabase, organizationId);
    return await services.accountService.deleteAccount(id);
  }, [supabase, organizationId]);

  const adjustAccountBalance = useCallback(async (accountId: string, amount: number) => {
    if (!organizationId) {
      console.error('No organization ID available');
      return false;
    }
    const services = createServices(supabase, organizationId);
    return await services.accountService.adjustAccountBalance(accountId, amount);
  }, [supabase, organizationId]);

  const getTransactions = useCallback(async (filters?: TransactionFilterParams) => {
    if (!organizationId) {
      console.error('No organization ID available');
      return [];
    }
    const services = createServices(supabase, organizationId);
    return await services.transactionService.getTransactions(filters);
  }, [supabase, organizationId]);

  const createTransaction = useCallback(
    async (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'> & { organization_id: string }) => {
      if (!organizationId) {
        console.error('No organization ID available');
        throw new Error('Organization ID is required');
      }
      const services = createServices(supabase, organizationId);
      return await services.transactionService.createTransaction(transaction);
    },
    [supabase, organizationId]
  );

  const updateTransaction = useCallback(
    async (id: string, updates: Partial<Transaction>) => {
      if (!organizationId) {
        console.error('No organization ID available');
        throw new Error('Organization ID is required');
      }
      const services = createServices(supabase, organizationId);
      return await services.transactionService.updateTransaction(id, updates);
    },
    [supabase, organizationId]
  );

  const deleteTransaction = useCallback(async (id: string) => {
    if (!organizationId) {
      console.error('No organization ID available');
      return false;
    }
    const services = createServices(supabase, organizationId);
    return await services.transactionService.deleteTransaction(id);
  }, [supabase, organizationId]);

  const getInvoices = useCallback(async () => {
    if (!organizationId) {
      console.error('No organization ID available');
      return [];
    }
    const services = createServices(supabase, organizationId);
    return await services.invoiceService.getInvoices();
  }, [supabase, organizationId]);

  const createInvoice = useCallback(
    async (invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>) => {
      if (!organizationId) {
        console.error('No organization ID available');
        throw new Error('Organization ID is required');
      }
      const services = createServices(supabase, organizationId);
      return await services.invoiceService.createInvoice({
        ...invoice,
        organization_id: organizationId
      });
    },
    [supabase, organizationId]
  );

  const updateInvoice = useCallback(
    async (id: string, updates: Partial<Invoice>) => {
      if (!organizationId) {
        console.error('No organization ID available');
        throw new Error('Organization ID is required');
      }
      const services = createServices(supabase, organizationId);
      return await services.invoiceService.updateInvoice(id, updates);
    },
    [supabase, organizationId]
  );

  const deleteInvoice = useCallback(async (id: string) => {
    if (!organizationId) {
      console.error('No organization ID available');
      return false;
    }
    const services = createServices(supabase, organizationId);
    return await services.invoiceService.deleteInvoice(id);
  }, [supabase, organizationId]);

  const getBills = useCallback(async () => {
    if (!organizationId) {
      console.error('No organization ID available');
      return [];
    }
    const services = createServices(supabase, organizationId);
    return await services.billService.getBills();
  }, [supabase, organizationId]);

  const createBill = useCallback(
    async (bill: Omit<Bill, 'id' | 'createdAt' | 'updatedAt'> & { organization_id: string }) => {
      if (!organizationId) {
        console.error('No organization ID available');
        throw new Error('Organization ID is required');
      }
      const services = createServices(supabase, organizationId);
      return await services.billService.createBill(bill);
    },
    [supabase, organizationId]
  );

  const updateBill = useCallback(
    async (id: string, updates: Partial<Bill>) => {
      if (!organizationId) {
        console.error('No organization ID available');
        throw new Error('Organization ID is required');
      }
      const services = createServices(supabase, organizationId);
      return await services.billService.updateBill(id, updates);
    },
    [supabase, organizationId]
  );

  const deleteBill = useCallback(async (id: string) => {
    if (!organizationId) {
      console.error('No organization ID available');
      return false;
    }
    const services = createServices(supabase, organizationId);
    return await services.billService.deleteBill(id);
  }, [supabase, organizationId]);

  const getPayrollItems = useCallback(async () => {
    if (!organizationId) {
      console.error('No organization ID available');
      return [];
    }
    const services = createServices(supabase, organizationId);
    const response = await services.payrollService.getPayrollItems();
    return Array.isArray(response) ? response : response.data;
  }, [supabase, organizationId]);

  const createPayrollItem = useCallback(
    async (item: Omit<PayrollItem, 'id' | 'createdAt' | 'updatedAt'>) => {
      if (!organizationId) {
        console.error('No organization ID available');
        throw new Error('Organization ID is required');
      }
      const services = createServices(supabase, organizationId);
      return await services.payrollService.createPayrollItem(item);
    },
    [supabase, organizationId]
  );

  const updatePayrollItem = useCallback(
    async (id: string, updates: Partial<PayrollItem>) => {
      if (!organizationId) {
        console.error('No organization ID available');
        throw new Error('Organization ID is required');
      }
      const services = createServices(supabase, organizationId);
      return await services.payrollService.updatePayrollItem(id, updates);
    },
    [supabase, organizationId]
  );

  const deletePayrollItem = useCallback(async (id: string) => {
    if (!organizationId) {
      console.error('No organization ID available');
      return false;
    }
    const services = createServices(supabase, organizationId);
    return await services.payrollService.deletePayrollItem(id);
  }, [supabase, organizationId]);

  const getPayrollRuns = useCallback(async () => {
    if (!organizationId) {
      console.error('No organization ID available');
      return [];
    }
    const services = createServices(supabase, organizationId);
    const response = await services.payrollService.getPayrollRuns();
    return Array.isArray(response) ? response : response.data;
  }, [supabase, organizationId]);

  const createPayrollRun = useCallback(
    async (run: Omit<PayrollRun, 'id' | 'createdAt' | 'updatedAt'>) => {
      if (!organizationId) {
        console.error('No organization ID available');
        throw new Error('Organization ID is required');
      }
      const services = createServices(supabase, organizationId);
      return await services.payrollService.createPayrollRun(run);
    },
    [supabase, organizationId]
  );

  const updatePayrollRun = useCallback(
    async (id: string, updates: Partial<PayrollRun>) => {
      if (!organizationId) {
        console.error('No organization ID available');
        throw new Error('Organization ID is required');
      }
      const services = createServices(supabase, organizationId);
      return await services.payrollService.updatePayrollRun(id, updates);
    },
    [supabase, organizationId]
  );

  const deletePayrollRun = useCallback(async (id: string) => {
    if (!organizationId) {
      console.error('No organization ID available');
      return false;
    }
    const services = createServices(supabase, organizationId);
    return await services.payrollService.deletePayrollRun(id);
  }, [supabase, organizationId]);

  // Define the context value
  const contextValue: AccountingContextType = {
    state: {
      isLoading,
      isError,
      config,
      accounts,
      transactions,
      invoices,
      bills,
      payrolls: {
        items: payrollItems,
        runs: payrollRuns,
      },
      isInitialized,
    },
    getModuleConfig,
    getAccounts,
    createAccount,
    updateAccount,
    deleteAccount,
    adjustAccountBalance,
    getTransactions,
    createTransaction,
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
    getPayrollItems,
    createPayrollItem,
    updatePayrollItem,
    deletePayrollItem,
    getPayrollRuns,
    createPayrollRun,
    updatePayrollRun,
    deletePayrollRun,
  };
  
  return (
    <AccountingContext.Provider value={contextValue}>
      {children}
    </AccountingContext.Provider>
  );
}
