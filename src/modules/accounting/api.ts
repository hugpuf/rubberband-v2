
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/integrations/supabase/types";

import { AccountService } from "./services/AccountService";
import { TransactionService } from "./services/TransactionService";
import { InvoiceService } from "./services/InvoiceService";
import { BillService } from "./services/BillService";
import { SupabasePayrollService } from "./services/payroll/SupabasePayrollService";

export function createServices(client: SupabaseClient<Database>, organizationId: string) {
  const accountService = new AccountService(client, organizationId);
  const transactionService = new TransactionService(client, organizationId);
  const invoiceService = new InvoiceService(client, organizationId);
  const billService = new BillService(client, organizationId);
  const payrollService = new SupabasePayrollService(client, organizationId);
  
  return {
    accountService,
    transactionService,
    invoiceService,
    billService,
    payrollService
  };
}

export type Services = ReturnType<typeof createServices>;

// Define API functions that use the services
export const getAccountingConfig = async (supabase: SupabaseClient<Database>, organizationId: string) => {
  // Placeholder for fetching accounting config
  console.log('Fetching accounting config', supabase, organizationId);
  return {
    defaultCurrency: 'USD',
    fiscalYearStart: '2023-01-01',
    taxRate: 0.0825,
    isEnabled: true,
  };
};
