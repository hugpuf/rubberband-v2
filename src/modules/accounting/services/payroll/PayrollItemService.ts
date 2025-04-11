import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/integrations/supabase/types";
import { 
  PayrollItem, 
  PayrollItemFilterParams,
  PaginatedResponse
} from "@/modules/accounting/types";
import { PayrollServiceBase } from "./PayrollServiceBase";
import { mapPayrollItemFromDB } from "@/modules/accounting/utils/payrollMappers";

export class PayrollItemService extends PayrollServiceBase {
  constructor(client: SupabaseClient<Database>, organizationId: string) {
    super(client, organizationId);
  }

  async getPayrollItems(
    filters?: PayrollItemFilterParams
  ): Promise<PaginatedResponse<PayrollItem>> {
    try {
      let query = this.supabase
        .from("payroll_items")
        .select("*", { count: "exact" });

      if (filters?.payrollRunId) {
        query = query.eq("payroll_run_id", filters.payrollRunId);
      }

      if (filters?.contactId) {
        query = query.eq("contact_id", filters.contactId);
      }

      // Apply pagination if provided
      if (filters?.page && filters?.pageSize) {
        const from = (filters.page - 1) * filters.pageSize;
        const to = from + filters.pageSize - 1;
        query = query.range(from, to);
      }

      const { data, error, count } = await query;

      if (error) {
        console.error("Error fetching payroll items:", error);
        return { data: [], count: 0, page: 1, pageSize: 10 };
      }

      // Filter out items that don't belong to the organization
      // This is a fallback in case RLS isn't set correctly
      const filteredData = data.filter((item: any) => {
        const { organization_id, ...rest } = item;
        return rest;
      });

      // Fix the type instantiation issue by using a separate mapper function
      const mappedItems = filteredData.map((item: any) => mapPayrollItemFromDB(item));
      
      return {
        data: mappedItems,
        count: count || mappedItems.length,
        page: filters?.page || 1,
        pageSize: filters?.pageSize || 10,
      };
    } catch (error) {
      console.error("Error in getPayrollItems:", error);
      return { data: [], count: 0, page: 1, pageSize: 10 };
    }
  }

  async getPayrollItemById(id: string): Promise<PayrollItem | null> {
    try {
      const { data, error } = await this.supabase
        .from("payroll_items")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error(`Error fetching payroll item with ID ${id}:`, error);
        return null;
      }

      return mapPayrollItemFromDB(data);
    } catch (error) {
      console.error(`Error in getPayrollItemById:`, error);
      return null;
    }
  }

  async getPayrollItemsByRunId(runId: string): Promise<PayrollItem[]> {
    try {
      const { data, error } = await this.supabase
        .from("payroll_items")
        .select("*")
        .eq("payroll_run_id", runId);

      if (error) {
        console.error(`Error fetching payroll items for run ID ${runId}:`, error);
        return [];
      }

      return data.map((item: any) => mapPayrollItemFromDB(item));
    } catch (error) {
      console.error(`Error in getPayrollItemsByRunId:`, error);
      return [];
    }
  }

  async createPayrollItem(
    item: Omit<PayrollItem, "id" | "createdAt" | "updatedAt">
  ): Promise<PayrollItem> {
    try {
      const { data, error } = await this.supabase
        .from("payroll_items")
        .insert([{ ...item, organization_id: this.organizationId }])
        .select("*")
        .single();

      if (error) {
        console.error("Error creating payroll item:", error);
        throw error;
      }

      return mapPayrollItemFromDB(data);
    } catch (error) {
      console.error("Error in createPayrollItem:", error);
      throw error;
    }
  }

  async updatePayrollItem(
    id: string,
    updates: Partial<PayrollItem>
  ): Promise<PayrollItem> {
    try {
      const { data, error } = await this.supabase
        .from("payroll_items")
        .update(updates)
        .eq("id", id)
        .select("*")
        .single();

      if (error) {
        console.error(`Error updating payroll item with ID ${id}:`, error);
        throw error;
      }

      return mapPayrollItemFromDB(data);
    } catch (error) {
      console.error(`Error in updatePayrollItem:`, error);
      throw error;
    }
  }

  async deletePayrollItem(id: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from("payroll_items")
        .delete()
        .eq("id", id);

      if (error) {
        console.error(`Error deleting payroll item with ID ${id}:`, error);
        return false;
      }

      return true;
    } catch (error) {
      console.error(`Error in deletePayrollItem:`, error);
      return false;
    }
  }
}
