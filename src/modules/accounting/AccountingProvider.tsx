
import React from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/integrations/supabase/types';
import { AccountingContext } from './accountingContext';
import { useAccountingState } from './hooks/useAccountingState';
import { useAccountOperations } from './hooks/useAccountOperations';
import { useTransactionOperations } from './hooks/useTransactionOperations';
import { useInvoiceOperations } from './hooks/useInvoiceOperations';
import { useBillOperations } from './hooks/useBillOperations';
import { usePayrollOperations } from './hooks/usePayrollOperations';
import { useModuleConfig } from './hooks/useModuleConfig';

// Define the provider props
type AccountingProviderProps = {
  supabase: SupabaseClient<Database>;
  children: React.ReactNode;
};

export function AccountingProvider({ children, supabase }: AccountingProviderProps): JSX.Element {
  // Use the accounting state hook
  const state = useAccountingState(supabase);
  const { organizationId } = state;

  // Use operation hooks
  const { getModuleConfig } = useModuleConfig(supabase, organizationId);
  const accountOperations = useAccountOperations(supabase, organizationId);
  const transactionOperations = useTransactionOperations(supabase, organizationId);
  const invoiceOperations = useInvoiceOperations(supabase, organizationId);
  const billOperations = useBillOperations(supabase, organizationId);
  const payrollOperations = usePayrollOperations(supabase, organizationId);
  
  // Initialize module function (placeholder - to be implemented)
  const initializeModule = async () => {
    console.log("Initializing accounting module");
    // This would typically load initial data, check settings, etc.
  };
  
  // Update module config function (placeholder - to be implemented)
  const updateModuleConfig = async (config: any) => {
    console.log("Updating module config", config);
    // This would typically save config changes to the database
  };

  // Define the context value
  const contextValue = {
    state: {
      isLoading: state.isLoading,
      isError: state.isError,
      config: state.config,
      accounts: state.accounts,
      transactions: state.transactions,
      invoices: state.invoices,
      bills: state.bills,
      payrolls: {
        items: state.payrollItems,
        runs: state.payrollRuns,
      },
      isInitialized: state.isInitialized,
    },
    initializeModule,
    updateModuleConfig,
    getModuleConfig,
    ...accountOperations,
    ...transactionOperations,
    ...invoiceOperations,
    ...billOperations,
    ...payrollOperations,
    // Adding customer and vendor balance methods as stubs
    getCustomerBalance: async (customerId: string) => 0,
    getVendorBalance: async (vendorId: string) => 0,
    // Add payroll-specific methods that might be missing
    exportPayrollRun: async (id: string, format: 'csv' | 'pdf' | 'json') => '',
    processPayrollRun: async (id: string) => ({ id } as any),
    finalizePayrollRun: async (id: string) => ({ id } as any),
  };
  
  return (
    <AccountingContext.Provider value={contextValue}>
      {children}
    </AccountingContext.Provider>
  );
}
