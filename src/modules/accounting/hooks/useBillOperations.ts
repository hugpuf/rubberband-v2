
import { useCallback } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/integrations/supabase/types';
import { createServices } from '../api';
import { Bill } from '../types';

export const useBillOperations = (supabase: SupabaseClient<Database>, organizationId: string) => {
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

  return {
    getBills,
    createBill,
    updateBill,
    deleteBill
  };
};
