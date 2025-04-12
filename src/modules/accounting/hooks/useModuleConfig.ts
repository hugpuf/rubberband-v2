
import { useCallback } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/integrations/supabase/types';
import { getAccountingConfig } from '../api';
import { AccountingModuleConfig } from '../types';

export const useModuleConfig = (supabase: SupabaseClient<Database>, organizationId: string) => {
  const getModuleConfig = useCallback(async () => {
    if (!organizationId) {
      console.error('No organization ID available');
      return null;
    }
    
    try {
      return await getAccountingConfig(supabase, organizationId);
    } catch (error) {
      console.error('Error getting module config:', error);
      return null;
    }
  }, [supabase, organizationId]);

  return { getModuleConfig };
};
