
import { useCallback } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/integrations/supabase/types';
import { createServices } from '../api';
import { Invoice } from '../types';

export const useInvoiceOperations = (supabase: SupabaseClient<Database>, organizationId: string) => {
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

  return {
    getInvoices,
    createInvoice,
    updateInvoice,
    deleteInvoice
  };
};
