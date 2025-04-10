
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/integrations/supabase/types";
import { 
  PayrollItem, 
  CreatePayrollItemParams, 
  UpdatePayrollItemParams, 
  PayrollItemFilterParams
} from "../../types/payroll";
import { PaginatedResponse } from "../../types/common";
import { PayrollServiceBase } from "./PayrollServiceBase";

export class PayrollItemService extends PayrollServiceBase {
  constructor(client: SupabaseClient<Database>, organizationId: string) {
    super(client, organizationId);
  }

  async getPayrollItems(filters?: PayrollItemFilterParams): Promise<PaginatedResponse<PayrollItem>> {
    try {
      // Start with base query including organization filter through the payroll run
      let query = this.supabase
        .from('payroll_items')
        .select('*, payroll_runs!inner(organization_id)', { count: 'exact' })
        .eq('payroll_runs.organization_id', this.organizationId);

      // Apply filters if provided
      if (filters) {
        if (filters.payrollRunId) {
          query = query.eq('payroll_run_id', filters.payrollRunId);
        }
        if (filters.employeeId) {
          query = query.eq('contact_id', filters.employeeId);
        }
        if (filters.status) {
          query = query.eq('status', filters.status);
        }
        
        // Pagination
        const page = filters.page || 1;
        const limit = filters.limit || 10;
        const from = (page - 1) * limit;
        const to = from + limit - 1;
        
        query = query.range(from, to);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      // Filter out the joined payroll_runs data
      const filteredData = data.map(item => {
        const { payroll_runs, ...rest } = item;
        return rest;
      });

      const mappedData = filteredData.map(this.mapPayrollItemFromDB);
      
      return {
        data: mappedData,
        total: count || mappedData.length,
        page: filters?.page || 1,
        limit: filters?.limit || 10
      };
    } catch (error) {
      console.error("Error fetching payroll items:", error);
      return { data: [], total: 0, page: 1, limit: 10 };
    }
  }

  async getPayrollItemById(id: string): Promise<PayrollItem | null> {
    try {
      // Join with payroll_runs to filter by organization_id
      const { data, error } = await this.supabase
        .from('payroll_items')
        .select('*, payroll_runs!inner(organization_id)')
        .eq('id', id)
        .eq('payroll_runs.organization_id', this.organizationId)
        .maybeSingle();

      if (error) {
        console.error(`Error fetching payroll item ${id}:`, error);
        return null;
      }

      if (!data) return null;

      // Remove the joined payroll_runs data
      const { payroll_runs, ...itemData } = data;
      return this.mapPayrollItemFromDB(itemData);
    } catch (error) {
      console.error(`Error fetching payroll item ${id}:`, error);
      return null;
    }
  }

  async getPayrollItemsByRunId(runId: string): Promise<PayrollItem[]> {
    try {
      // First, verify the run belongs to the organization
      const { data: runData, error: runError } = await this.supabase
        .from('payroll_runs')
        .select('id')
        .eq('id', runId)
        .eq('organization_id', this.organizationId)
        .maybeSingle();

      if (runError || !runData) {
        console.error(`Error or unauthorized payroll run ${runId}`);
        return [];
      }

      const { data, error } = await this.supabase
        .from('payroll_items')
        .select('*')
        .eq('payroll_run_id', runId);

      if (error) {
        console.error(`Error fetching payroll items for run ${runId}:`, error);
        return [];
      }

      return data.map(this.mapPayrollItemFromDB);
    } catch (error) {
      console.error(`Error fetching payroll items for run ${runId}:`, error);
      return [];
    }
  }

  async createPayrollItem(params: CreatePayrollItemParams): Promise<PayrollItem> {
    try {
      // First, verify the run belongs to the organization
      const { data: runData, error: runError } = await this.supabase
        .from('payroll_runs')
        .select('id')
        .eq('id', params.payrollRunId)
        .eq('organization_id', this.organizationId)
        .maybeSingle();

      if (runError || !runData) {
        throw new Error(`Unauthorized or invalid payroll run ${params.payrollRunId}`);
      }

      const { data, error } = await this.supabase
        .from('payroll_items')
        .insert([
          {
            payroll_run_id: params.payrollRunId,
            contact_id: params.employeeId,
            employee_name: params.employeeName,
            gross_salary: params.grossSalary,
            regular_hours: params.regularHours,
            overtime_hours: params.overtimeHours,
            hourly_rate: params.hourlyRate,
            base_salary: params.baseSalary,
            tax_amount: params.taxAmount,
            deductions: params.deductions,
            benefits: params.benefits,
            deduction_amount: params.deductionAmount,
            net_salary: params.netSalary,
            notes: params.notes,
            status: params.status || 'pending',
          },
        ])
        .select('*')
        .single();

      if (error) throw error;

      return this.mapPayrollItemFromDB(data);
    } catch (error) {
      console.error("Error creating payroll item:", error);
      throw error;
    }
  }

  async updatePayrollItem(id: string, updates: UpdatePayrollItemParams): Promise<PayrollItem> {
    try {
      // First, verify this item belongs to a run in the organization
      const { data: itemData, error: itemError } = await this.supabase
        .from('payroll_items')
        .select('payroll_run_id')
        .eq('id', id)
        .maybeSingle();

      if (itemError || !itemData) {
        throw new Error(`Payroll item ${id} not found`);
      }

      const { data: runData, error: runError } = await this.supabase
        .from('payroll_runs')
        .select('id')
        .eq('id', itemData.payroll_run_id)
        .eq('organization_id', this.organizationId)
        .maybeSingle();

      if (runError || !runData) {
        throw new Error(`Unauthorized access to payroll item ${id}`);
      }

      const { data, error } = await this.supabase
        .from('payroll_items')
        .update({
          payroll_run_id: updates.payrollRunId,
          contact_id: updates.employeeId,
          employee_name: updates.employeeName,
          gross_salary: updates.grossSalary,
          regular_hours: updates.regularHours,
          overtime_hours: updates.overtimeHours,
          hourly_rate: updates.hourlyRate,
          base_salary: updates.baseSalary,
          tax_amount: updates.taxAmount,
          deductions: updates.deductions,
          benefits: updates.benefits,
          deduction_amount: updates.deductionAmount,
          net_salary: updates.netSalary,
          notes: updates.notes,
          status: updates.status,
        })
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw error;

      return this.mapPayrollItemFromDB(data);
    } catch (error) {
      console.error(`Error updating payroll item ${id}:`, error);
      throw error;
    }
  }

  async deletePayrollItem(id: string): Promise<boolean> {
    try {
      // First, verify this item belongs to a run in the organization
      const { data: itemData, error: itemError } = await this.supabase
        .from('payroll_items')
        .select('payroll_run_id')
        .eq('id', id)
        .maybeSingle();

      if (itemError || !itemData) {
        console.error(`Payroll item ${id} not found`);
        return false;
      }

      const { data: runData, error: runError } = await this.supabase
        .from('payroll_runs')
        .select('id')
        .eq('id', itemData.payroll_run_id)
        .eq('organization_id', this.organizationId)
        .maybeSingle();

      if (runError || !runData) {
        console.error(`Unauthorized access to payroll item ${id}`);
        return false;
      }

      const { error } = await this.supabase
        .from('payroll_items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error(`Error deleting payroll item ${id}:`, error);
      return false;
    }
  }
}
