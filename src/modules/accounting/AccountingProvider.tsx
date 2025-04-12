
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
    getModuleConfig,
    ...accountOperations,
    ...transactionOperations,
    ...invoiceOperations,
    ...billOperations,
    ...payrollOperations,
  };
  
  return (
    <AccountingContext.Provider value={contextValue}>
      {children}
    </AccountingContext.Provider>
  );
}
