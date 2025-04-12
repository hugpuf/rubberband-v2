
import { useCallback } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/integrations/supabase/types';
import { createServices } from '../api';
import { Transaction, TransactionFilterParams } from '../types';

export const useTransactionOperations = (supabase: SupabaseClient<Database>, organizationId: string) => {
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

  return {
    getTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction
  };
};
