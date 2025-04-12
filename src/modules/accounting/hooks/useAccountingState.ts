
import { useState, useEffect } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { useUser } from '@supabase/auth-helpers-react';
import { Database } from '@/integrations/supabase/types';
import { createServices } from '../api';
import { AccountingModuleConfig, Account, Transaction, Invoice, Bill, PayrollItem, PayrollRun } from '../types';

export const useAccountingState = (supabase: SupabaseClient<Database>) => {
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

  return {
    isLoading,
    isError,
    config,
    accounts,
    transactions,
    invoices,
    bills,
    payrollItems,
    payrollRuns,
    isInitialized,
    setConfig,
    setAccounts,
    setTransactions,
    setInvoices,
    setBills,
    setPayrollItems,
    setPayrollRuns,
    organizationId
  };
};
