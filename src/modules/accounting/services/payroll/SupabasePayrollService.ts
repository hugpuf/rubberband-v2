import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/integrations/supabase/types";
import {
  PayrollItem,
  PayrollRun,
  CreatePayrollRunParams,
  UpdatePayrollRunParams,
  CreatePayrollItemParams,
  UpdatePayrollItemParams,
  PayrollRunFilterParams,
  PayrollItemFilterParams,
  PaginatedResponse,
  PAYROLL_RUN_STATUS
} from "../../types/payroll";
import { PayrollServiceInterface } from "./PayrollServiceInterface";

export class SupabasePayrollService implements PayrollServiceInterface {
  private supabase: SupabaseClient<Database>;

  constructor(client: SupabaseClient<Database>) {
    this.supabase = client;
  }

  // Simplified implementation to fix type instantiation issues
  async getPayrollRuns(filters?: PayrollRunFilterParams): Promise<PaginatedResponse<PayrollRun>> {
    try {
      let query = this.supabase
        .from('payroll_runs')
        .select('*', { count: 'exact' });

      // Apply filters if provided
      if (filters) {
        if (filters.status) {
          query = query.eq('status', filters.status);
        }
        if (filters.startDate) {
          query = query.gte('period_start', filters.startDate);
        }
        if (filters.endDate) {
          query = query.lte('period_end', filters.endDate);
        }
        if (filters.search) {
          query = query.ilike('name', `%${filters.search}%`);
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

      const mappedData = data.map(this.mapPayrollRunFromDB);
      
      return {
        data: mappedData,
        total: count || mappedData.length,
        page: filters?.page || 1,
        limit: filters?.limit || 10
      };
    } catch (error) {
      console.error("Error fetching payroll runs:", error);
      return { data: [], total: 0, page: 1, limit: 10 };
    }
  }

  // Simplified implementation to return all items rather than paginated
  async getPayrollItems(filters?: PayrollItemFilterParams): Promise<PaginatedResponse<PayrollItem>> {
    try {
      let query = this.supabase
        .from('payroll_items')
        .select('*', { count: 'exact' });

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
        if (filters.search) {
          // Since employee name isn't directly searchable, we'd need a join or filter on client side
          // This is a simplification
          query = query.or(`id.eq.${filters.search},contact_id.eq.${filters.search}`);
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

      const mappedData = data.map(this.mapPayrollItemFromDB);
      
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

  async getPayrollRunById(id: string): Promise<PayrollRun | null> {
    try {
      const { data, error } = await this.supabase
        .from('payroll_runs')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error(`Error fetching payroll run ${id}:`, error);
        return null;
      }

      return this.mapPayrollRunFromDB(data);
    } catch (error) {
      console.error(`Error fetching payroll run ${id}:`, error);
      return null;
    }
  }

  async createPayrollRun(params: CreatePayrollRunParams): Promise<PayrollRun> {
    try {
      const { data, error } = await this.supabase
        .from('payroll_runs')
        .insert([
          {
            name: params.name,
            organization_id: params.organizationId,
            period_start: params.periodStart,
            period_end: params.periodEnd,
            status: params.status || PAYROLL_RUN_STATUS.DRAFT,
            payment_date: params.paymentDate,
            notes: params.notes,
          },
        ])
        .select('*')
        .single();

      if (error) throw error;

      return this.mapPayrollRunFromDB(data);
    } catch (error) {
      console.error("Error creating payroll run:", error);
      throw error;
    }
  }

  async updatePayrollRun(id: string, updates: UpdatePayrollRunParams): Promise<PayrollRun> {
    try {
      const { data, error } = await this.supabase
        .from('payroll_runs')
        .update({
          name: updates.name,
          period_start: updates.periodStart,
          period_end: updates.periodEnd,
          status: updates.status,
          payment_date: updates.paymentDate,
          notes: updates.notes,
        })
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw error;

      return this.mapPayrollRunFromDB(data);
    } catch (error) {
      console.error(`Error updating payroll run ${id}:`, error);
      throw error;
    }
  }

  async deletePayrollRun(id: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('payroll_runs')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error(`Error deleting payroll run ${id}:`, error);
      return false;
    }
  }

  async getPayrollItemById(id: string): Promise<PayrollItem | null> {
    try {
      const { data, error } = await this.supabase
        .from('payroll_items')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error(`Error fetching payroll item ${id}:`, error);
        return null;
      }

      return this.mapPayrollItemFromDB(data);
    } catch (error) {
      console.error(`Error fetching payroll item ${id}:`, error);
      return null;
    }
  }

  async createPayrollItem(params: CreatePayrollItemParams): Promise<PayrollItem> {
    try {
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

  async processPayrollRun(id: string): Promise<PayrollRun> {
    try {
      // Placeholder for processing logic - in a real app, this would calculate payroll
      // For now, we simply update the status to 'processing'
      const { data, error } = await this.supabase
        .from('payroll_runs')
        .update({ status: PAYROLL_RUN_STATUS.PROCESSING })
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw error;

      return this.mapPayrollRunFromDB(data);
    } catch (error) {
      console.error(`Error processing payroll run ${id}:`, error);
      throw error;
    }
  }

  async finalizePayrollRun(id: string): Promise<PayrollRun> {
    try {
      // Placeholder for finalization logic - in a real app, this would lock the payroll
      // For now, we simply update the status to 'completed'
      const { data, error } = await this.supabase
        .from('payroll_runs')
        .update({ status: PAYROLL_RUN_STATUS.COMPLETED })
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw error;

      return this.mapPayrollRunFromDB(data);
    } catch (error) {
      console.error(`Error finalizing payroll run ${id}:`, error);
      throw error;
    }
  }

  async exportPayrollRun(id: string, format: 'csv' | 'pdf' | 'json'): Promise<string> {
    try {
      // Placeholder for export logic - in a real app, this would generate a file
      // For now, we simply return a string indicating the export type
      return `Payroll run ${id} exported as ${format}`;
    } catch (error) {
      console.error(`Error exporting payroll run ${id}:`, error);
      throw error;
    }
  }

  private mapPayrollRunFromDB(data: any): PayrollRun {
    return {
      id: data.id,
      name: data.name,
      organizationId: data.organization_id,
      periodStart: data.period_start,
      periodEnd: data.period_end,
      status: data.status,
      employeeCount: data.employee_count || 0,
      grossAmount: data.gross_amount || 0,
      taxAmount: data.tax_amount || 0,
      deductionAmount: data.deduction_amount || 0,
      netAmount: data.net_amount || 0,
      paymentDate: data.payment_date,
      notes: data.notes,
      processingErrors: data.processing_errors,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  private mapPayrollItemFromDB(data: any): PayrollItem {
    return {
      id: data.id,
      payrollRunId: data.payroll_run_id,
      employeeId: data.contact_id,
      employeeName: data.employee_name || 'Unknown Employee',
      grossSalary: data.gross_salary || 0,
      regularHours: data.regular_hours,
      overtimeHours: data.overtime_hours,
      hourlyRate: data.hourly_rate,
      baseSalary: data.base_salary,
      taxAmount: data.tax_amount || 0,
      deductions: data.deductions || [],
      benefits: data.benefits || [],
      deductionAmount: data.deduction_amount || 0,
      netSalary: data.net_salary || 0,
      notes: data.notes,
      status: data.status || 'pending',
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }
}
