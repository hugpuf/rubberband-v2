
import { SupabaseClient } from "@supabase/supabase-js";
import { IPayrollService } from "./PayrollServiceInterface";
import { SupabasePayrollService } from "./SupabasePayrollService";
import { Database } from "@/integrations/supabase/types";

export class PayrollServiceFactory {
  static createPayrollService(client: SupabaseClient<Database>): IPayrollService {
    return new SupabasePayrollService(client);
  }
}
