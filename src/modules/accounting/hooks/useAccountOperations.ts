
import { useCallback } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/integrations/supabase/types';
import { createServices } from '../api';
import { Account } from '../types';

export const useAccountOperations = (supabase: SupabaseClient<Database>, organizationId: string) => {
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

  return {
    getAccounts,
    createAccount,
    updateAccount,
    deleteAccount,
    adjustAccountBalance
  };
};
