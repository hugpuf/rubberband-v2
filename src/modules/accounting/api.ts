
import { supabase } from "@/integrations/supabase/client";
import { logUserAction } from "@/services/userLogs";
import { 
  AccountingModuleConfig, 
  Account, 
  Transaction, 
  Invoice, 
  Bill 
} from "./types";

/**
 * Retrieves the accounting module configuration from the module registry
 */
export const getAccountingConfig = async (organizationId: string): Promise<AccountingModuleConfig | null> => {
  try {
    const { data, error } = await supabase
      .from('module_registry')
      .select('config, is_enabled')
      .eq('organization_id', organizationId)
      .eq('module_name', 'accounting')
      .maybeSingle();
      
    if (error) throw error;
    
    if (!data) return null;
    
    // Convert from database format to our type
    return {
      defaultCurrency: data.config.default_currency || 'USD',
      fiscalYearStart: data.config.fiscal_year_start || '01-01',
      taxRate: data.config.tax_rate || 0,
      isEnabled: data.is_enabled
    };
  } catch (error) {
    console.error('Error fetching accounting config:', error);
    return null;
  }
};

/**
 * Updates the accounting module configuration in the module registry
 */
export const updateAccountingConfig = async (
  organizationId: string, 
  config: Partial<AccountingModuleConfig>
): Promise<void> => {
  try {
    // Transform our config type to database format
    const dbConfig: Record<string, any> = {};
    
    if (config.defaultCurrency) dbConfig.default_currency = config.defaultCurrency;
    if (config.fiscalYearStart) dbConfig.fiscal_year_start = config.fiscalYearStart;
    if (config.taxRate !== undefined) dbConfig.tax_rate = config.taxRate;
    
    // Get existing config first
    const { data: existingData } = await supabase
      .from('module_registry')
      .select('config')
      .eq('organization_id', organizationId)
      .eq('module_name', 'accounting')
      .maybeSingle();
      
    // Merge with existing config
    const mergedConfig = {
      ...(existingData?.config || {}),
      ...dbConfig
    };
    
    // Update the registry
    const { error } = await supabase
      .from('module_registry')
      .update({ 
        config: mergedConfig,
        is_enabled: config.isEnabled !== undefined ? config.isEnabled : existingData?.is_enabled 
      })
      .eq('organization_id', organizationId)
      .eq('module_name', 'accounting');
      
    if (error) throw error;
    
    // Log the action
    await logUserAction({
      module: 'accounting',
      action: 'update_config',
      metadata: { config: dbConfig }
    });
  } catch (error) {
    console.error('Error updating accounting config:', error);
    throw error;
  }
};

/**
 * Fetches accounts from the accounting system
 */
export const fetchAccounts = async (organizationId: string): Promise<Account[]> => {
  try {
    // This is a placeholder - in a real implementation, this would fetch from the accounts table
    // For now, returning mock data for demonstration purposes
    return [
      {
        id: '1',
        code: '1000',
        name: 'Cash',
        type: 'asset',
        description: 'Cash on hand',
        isActive: true,
        balance: 10000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '2',
        code: '4000',
        name: 'Revenue',
        type: 'revenue',
        description: 'Operating revenue',
        isActive: true,
        balance: 50000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '3',
        code: '5000',
        name: 'Expenses',
        type: 'expense',
        description: 'Operating expenses',
        isActive: true,
        balance: 20000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
  } catch (error) {
    console.error('Error fetching accounts:', error);
    return [];
  }
};

/**
 * Cross-module integration - Get customer balance
 */
export const getCustomerBalance = async (customerId: string): Promise<number> => {
  try {
    // This is a placeholder for future implementation
    // This would typically query the database to calculate the customer's outstanding balance
    return 0;
  } catch (error) {
    console.error('Error getting customer balance:', error);
    return 0;
  }
};

/**
 * Cross-module integration - Get vendor balance
 */
export const getVendorBalance = async (vendorId: string): Promise<number> => {
  try {
    // This is a placeholder for future implementation
    // This would typically query the database to calculate the vendor's outstanding balance
    return 0;
  } catch (error) {
    console.error('Error getting vendor balance:', error);
    return 0;
  }
};
