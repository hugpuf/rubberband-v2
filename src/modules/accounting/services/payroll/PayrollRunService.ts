
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/integrations/supabase/types";
import { 
  PayrollRun, 
  CreatePayrollRunParams, 
  UpdatePayrollRunParams, 
  PayrollRunFilterParams,
  PAYROLL_RUN_STATUS
} from "../../types/payroll";
import { PaginatedResponse } from "../../types/common";
import { PayrollServiceBase } from "./PayrollServiceBase";

export class PayrollRunService extends PayrollServiceBase {
  constructor(client: SupabaseClient<Database>, organizationId: string) {
    super(client, organizationId);
  }

  async getPayrollRuns(filters?: PayrollRunFilterParams): Promise<PaginatedResponse<PayrollRun>> {
    try {
      let query = this.supabase
        .from('payroll_runs')
        .select('*', { count: 'exact' })
        .eq('organization_id', this.organizationId);

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

  async getPayrollRunById(id: string): Promise<PayrollRun | null> {
    try {
      const { data, error } = await this.supabase
        .from('payroll_runs')
        .select('*')
        .eq('id', id)
        .eq('organization_id', this.organizationId)
        .maybeSingle();

      if (error) {
        console.error(`Error fetching payroll run ${id}:`, error);
        return null;
      }

      return data ? this.mapPayrollRunFromDB(data) : null;
    } catch (error) {
      console.error(`Error fetching payroll run ${id}:`, error);
      return null;
    }
  }

  async createPayrollRun(params: CreatePayrollRunParams): Promise<PayrollRun> {
    try {
      // Use the organizationId from the service instance
      const organizationId = params.organizationId || this.organizationId;
      
      const { data, error } = await this.supabase
        .from('payroll_runs')
        .insert([
          {
            name: params.name,
            organization_id: organizationId,
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
        .eq('organization_id', this.organizationId)
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
        .eq('id', id)
        .eq('organization_id', this.organizationId);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error(`Error deleting payroll run ${id}:`, error);
      return false;
    }
  }

  async processPayrollRun(id: string): Promise<PayrollRun> {
    try {
      const { data, error } = await this.supabase
        .from('payroll_runs')
        .update({ status: PAYROLL_RUN_STATUS.PROCESSING })
        .eq('id', id)
        .eq('organization_id', this.organizationId)
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
      const { data, error } = await this.supabase
        .from('payroll_runs')
        .update({ status: PAYROLL_RUN_STATUS.COMPLETED })
        .eq('id', id)
        .eq('organization_id', this.organizationId)
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
      // Verify run belongs to organization
      const run = await this.getPayrollRunById(id);
      if (!run) {
        throw new Error(`Payroll run ${id} not found or unauthorized`);
      }
      
      // In a real app, this would generate a file and return a download URL
      // For now, return a placeholder message
      return `Payroll run ${id} exported as ${format}`;
    } catch (error) {
      console.error(`Error exporting payroll run ${id}:`, error);
      throw error;
    }
  }
}
