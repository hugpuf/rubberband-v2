
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/integrations/supabase/types";
import { 
  PayrollItem, 
  PayrollItemFilterParams,
  PaginatedResponse
} from "@/modules/accounting/types";
import { PayrollServiceBase } from "./PayrollServiceBase";

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

      if (filters?.employeeId) {
        query = query.eq("contact_id", filters.employeeId);
      }

      // Apply pagination if provided
      if (filters?.page && filters?.limit) {
        const from = (filters.page - 1) * filters.limit;
        const to = from + filters.limit - 1;
        query = query.range(from, to);
      }

      const { data, error, count } = await query;

      if (error) {
        console.error("Error fetching payroll items:", error);
        return { 
          data: [], 
          total: 0, 
          page: filters?.page || 1, 
          limit: filters?.limit || 10 
        };
      }

      // Filter out items that don't belong to the organization
      // This is a fallback in case RLS isn't set correctly
      const filteredData = data.filter((item: any) => {
        const { organization_id, ...rest } = item;
        return rest;
      });

      // Map database items to application model
      const mappedItems = filteredData.map(this.mapPayrollItemFromDB);
      
      return {
        data: mappedItems,
        total: count || mappedItems.length,
        page: filters?.page || 1,
        limit: filters?.limit || 10
      };
    } catch (error) {
      console.error("Error in getPayrollItems:", error);
      return { 
        data: [], 
        total: 0, 
        page: 1, 
        limit: 10 
      };
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

      return this.mapPayrollItemFromDB(data);
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

      return data.map(this.mapPayrollItemFromDB);
    } catch (error) {
      console.error(`Error in getPayrollItemsByRunId:`, error);
      return [];
    }
  }

  async createPayrollItem(
    item: Omit<PayrollItem, "id" | "createdAt" | "updatedAt">
  ): Promise<PayrollItem> {
    try {
      // Convert to database format
      const dbItem = this.mapPayrollItemToDB(item);
      
      const { data, error } = await this.supabase
        .from("payroll_items")
        .insert([dbItem])
        .select("*")
        .single();

      if (error) {
        console.error("Error creating payroll item:", error);
        throw error;
      }

      return this.mapPayrollItemFromDB(data);
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
      // Convert to database format
      const dbUpdates = this.mapPayrollItemUpdatesToDB(updates);
      
      const { data, error } = await this.supabase
        .from("payroll_items")
        .update(dbUpdates)
        .eq("id", id)
        .select("*")
        .single();

      if (error) {
        console.error(`Error updating payroll item with ID ${id}:`, error);
        throw error;
      }

      return this.mapPayrollItemFromDB(data);
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
  
  // Helper methods for mapping between DB and model formats
  private mapPayrollItemFromDB(item: any): PayrollItem {
    return {
      id: item.id,
      status: item.status || 'pending',
      payrollRunId: item.payroll_run_id,
      employeeId: item.contact_id,
      employeeName: item.contact_name || 'Unknown Employee',
      grossSalary: item.gross_salary || 0,
      regularHours: item.regular_hours || 0,
      overtimeHours: item.overtime_hours || 0,
      sickLeaveHours: item.sick_leave_hours || 0,
      vacationHours: item.vacation_hours || 0,
      taxAmount: item.tax_amount || 0,
      deductionAmount: item.deduction_amount || 0,
      netSalary: item.net_salary || 0,
      notes: item.notes,
      createdAt: item.created_at ? new Date(item.created_at) : new Date(),
      updatedAt: item.updated_at ? new Date(item.updated_at) : new Date()
    };
  }
  
  private mapPayrollItemToDB(item: Omit<PayrollItem, "id" | "createdAt" | "updatedAt">) {
    return {
      payroll_run_id: item.payrollRunId,
      contact_id: item.employeeId,
      contact_name: item.employeeName,
      status: item.status,
      gross_salary: item.grossSalary,
      regular_hours: item.regularHours,
      overtime_hours: item.overtimeHours,
      sick_leave_hours: item.sickLeaveHours,
      vacation_hours: item.vacationHours,
      tax_amount: item.taxAmount,
      deduction_amount: item.deductionAmount,
      net_salary: item.netSalary,
      notes: item.notes,
      organization_id: this.organizationId
    };
  }
  
  private mapPayrollItemUpdatesToDB(updates: Partial<PayrollItem>) {
    const dbUpdates: Record<string, any> = {};
    
    if (updates.status) dbUpdates.status = updates.status;
    if (updates.payrollRunId) dbUpdates.payroll_run_id = updates.payrollRunId;
    if (updates.employeeId) dbUpdates.contact_id = updates.employeeId;
    if (updates.employeeName) dbUpdates.contact_name = updates.employeeName;
    if (updates.grossSalary !== undefined) dbUpdates.gross_salary = updates.grossSalary;
    if (updates.regularHours !== undefined) dbUpdates.regular_hours = updates.regularHours;
    if (updates.overtimeHours !== undefined) dbUpdates.overtime_hours = updates.overtimeHours;
    if (updates.sickLeaveHours !== undefined) dbUpdates.sick_leave_hours = updates.sickLeaveHours;
    if (updates.vacationHours !== undefined) dbUpdates.vacation_hours = updates.vacationHours;
    if (updates.taxAmount !== undefined) dbUpdates.tax_amount = updates.taxAmount;
    if (updates.deductionAmount !== undefined) dbUpdates.deduction_amount = updates.deductionAmount;
    if (updates.netSalary !== undefined) dbUpdates.net_salary = updates.netSalary;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
    
    return dbUpdates;
  }
}
