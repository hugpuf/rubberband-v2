
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/integrations/supabase/types";
import { IPayrollService } from "./PayrollServiceInterface";
import { SupabasePayrollService } from "./SupabasePayrollService";

export class PayrollServiceFactory {
  static createPayrollService(client: SupabaseClient<Database>, organizationId: string): IPayrollService {
    // Currently only supporting Supabase implementation
    return new SupabasePayrollService(client, organizationId);
  }
}
