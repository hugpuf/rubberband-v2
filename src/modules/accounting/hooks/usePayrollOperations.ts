
import { useCallback } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/integrations/supabase/types';
import { createServices } from '../api';
import { PayrollItem, PayrollRun } from '../types';

export const usePayrollOperations = (supabase: SupabaseClient<Database>, organizationId: string) => {
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

  return {
    getPayrollItems,
    createPayrollItem,
    updatePayrollItem,
    deletePayrollItem,
    getPayrollRuns,
    createPayrollRun,
    updatePayrollRun,
    deletePayrollRun
  };
};
