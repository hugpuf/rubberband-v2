
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
  TaxCalculationResult,
  PAYROLL_RUN_STATUS
} from "../../types/payroll";
import { PaginatedResponse } from "../../types/common";
import { IPayrollService } from "./PayrollServiceInterface";

export class SupabasePayrollService implements IPayrollService {
  private supabase: SupabaseClient<Database>;
  private organizationId: string;

  constructor(client: SupabaseClient<Database>, organizationId: string) {
    this.supabase = client;
    this.organizationId = organizationId;
  }

  async getPayrollRuns(filters?: PayrollRunFilterParams): Promise<PaginatedResponse<PayrollRun>> {
    try {
      let query = this.supabase
        .from('payroll_runs')
        .select('*', { count: 'exact' })
        .eq('organization_id', this.organizationId); // Filter by organization_id

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

  async getPayrollRunById(id: string): Promise<PayrollRun | null> {
    try {
      const { data, error } = await this.supabase
        .from('payroll_runs')
        .select('*')
        .eq('id', id)
        .eq('organization_id', this.organizationId) // Filter by organization_id
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
        .eq('organization_id', this.organizationId) // Filter by organization_id
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
        .eq('organization_id', this.organizationId); // Filter by organization_id

      if (error) throw error;

      return true;
    } catch (error) {
      console.error(`Error deleting payroll run ${id}:`, error);
      return false;
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

  async processPayrollRun(id: string): Promise<PayrollRun> {
    try {
      const { data, error } = await this.supabase
        .from('payroll_runs')
        .update({ status: PAYROLL_RUN_STATUS.PROCESSING })
        .eq('id', id)
        .eq('organization_id', this.organizationId) // Filter by organization_id
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
        .eq('organization_id', this.organizationId) // Filter by organization_id
        .select('*')
        .single();

      if (error) throw error;

      return this.mapPayrollRunFromDB(data);
    } catch (error) {
      console.error(`Error finalizing payroll run ${id}:`, error);
      throw error;
    }
  }

  async calculateTaxes(grossAmount: number, employeeId: string): Promise<TaxCalculationResult> {
    // Simple tax calculation implementation
    // In a real app, this would use complex tax tables and employee information
    try {
      const federalTaxRate = 0.15; // 15% federal tax
      const stateTaxRate = 0.05;   // 5% state tax
      const medicareTaxRate = 0.0145; // 1.45% Medicare
      const socialSecurityTaxRate = 0.062; // 6.2% Social Security
      
      const federalTax = grossAmount * federalTaxRate;
      const stateTax = grossAmount * stateTaxRate;
      const medicareTax = grossAmount * medicareTaxRate;
      const socialSecurityTax = grossAmount * socialSecurityTaxRate;
      
      const totalTax = federalTax + stateTax + medicareTax + socialSecurityTax;
      
      return {
        federalTax,
        stateTax,
        localTax: 0, // No local tax in this simple example
        medicareTax,
        socialSecurityTax,
        totalTax
      };
    } catch (error) {
      console.error(`Error calculating taxes for employee ${employeeId}:`, error);
      // Return zero taxes in case of error
      return {
        federalTax: 0,
        stateTax: 0,
        localTax: 0,
        medicareTax: 0,
        socialSecurityTax: 0,
        totalTax: 0
      };
    }
  }

  async recalculatePayrollItem(id: string): Promise<PayrollItem> {
    try {
      // Get the payroll item
      const payrollItem = await this.getPayrollItemById(id);
      if (!payrollItem) {
        throw new Error(`Payroll item ${id} not found`);
      }
      
      // Recalculate taxes
      const taxResult = await this.calculateTaxes(payrollItem.grossSalary, payrollItem.employeeId);
      
      // Calculate total deductions (tax + other deductions)
      let deductionAmount = taxResult.totalTax;
      (payrollItem.deductions || []).forEach(d => {
        deductionAmount += d.amount;
      });
      
      // Calculate net salary
      const netSalary = payrollItem.grossSalary - deductionAmount;
      
      // Update the payroll item
      const updatedItem = await this.updatePayrollItem(id, {
        taxAmount: taxResult.totalTax,
        deductionAmount,
        netSalary
      });
      
      return updatedItem;
    } catch (error) {
      console.error(`Error recalculating payroll item ${id}:`, error);
      throw error;
    }
  }

  async recalculatePayrollRun(id: string): Promise<PayrollRun> {
    try {
      // Get all items for this run
      const items = await this.getPayrollItemsByRunId(id);
      
      // Recalculate each item
      const updatedItems = await Promise.all(
        items.map(item => this.recalculatePayrollItem(item.id))
      );
      
      // Calculate totals
      const employeeCount = updatedItems.length;
      const grossAmount = updatedItems.reduce((sum, item) => sum + item.grossSalary, 0);
      const taxAmount = updatedItems.reduce((sum, item) => sum + item.taxAmount, 0);
      const deductionAmount = updatedItems.reduce((sum, item) => sum + item.deductionAmount, 0);
      const netAmount = updatedItems.reduce((sum, item) => sum + item.netSalary, 0);
      
      // Update the payroll run
      const { data, error } = await this.supabase
        .from('payroll_runs')
        .update({
          employee_count: employeeCount,
          gross_amount: grossAmount,
          tax_amount: taxAmount,
          deduction_amount: deductionAmount,
          net_amount: netAmount
        })
        .eq('id', id)
        .eq('organization_id', this.organizationId)
        .select('*')
        .single();
        
      if (error) throw error;
      
      return this.mapPayrollRunFromDB(data);
    } catch (error) {
      console.error(`Error recalculating payroll run ${id}:`, error);
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

  async importPayrollItems(runId: string, data: any[]): Promise<{ success: boolean; imported: number; errors: any[] }> {
    try {
      // Verify run belongs to organization
      const run = await this.getPayrollRunById(runId);
      if (!run) {
        throw new Error(`Payroll run ${runId} not found or unauthorized`);
      }
      
      const errors: any[] = [];
      const importedItems: PayrollItem[] = [];
      
      // Process each item in the data array
      for (const item of data) {
        try {
          // Create basic payroll item data structure
          const payrollItemData: CreatePayrollItemParams = {
            payrollRunId: runId,
            employeeId: item.employeeId,
            employeeName: item.employeeName,
            grossSalary: parseFloat(item.grossSalary) || 0,
            taxAmount: parseFloat(item.taxAmount) || 0,
            deductions: item.deductions || [],
            deductionAmount: parseFloat(item.deductionAmount) || 0,
            netSalary: parseFloat(item.netSalary) || 0,
            status: 'pending'
          };
          
          // Add optional fields if present
          if (item.regularHours) payrollItemData.regularHours = parseFloat(item.regularHours);
          if (item.overtimeHours) payrollItemData.overtimeHours = parseFloat(item.overtimeHours);
          if (item.hourlyRate) payrollItemData.hourlyRate = parseFloat(item.hourlyRate);
          if (item.baseSalary) payrollItemData.baseSalary = parseFloat(item.baseSalary);
          if (item.benefits) payrollItemData.benefits = item.benefits;
          if (item.notes) payrollItemData.notes = item.notes;
          
          // Create the payroll item
          const createdItem = await this.createPayrollItem(payrollItemData);
          importedItems.push(createdItem);
        } catch (itemError) {
          console.error(`Error importing payroll item:`, itemError);
          errors.push({
            item,
            error: (itemError as Error).message
          });
        }
      }
      
      // Recalculate the payroll run totals
      await this.recalculatePayrollRun(runId);
      
      return {
        success: errors.length === 0,
        imported: importedItems.length,
        errors
      };
    } catch (error) {
      console.error(`Error importing payroll items to run ${runId}:`, error);
      return {
        success: false,
        imported: 0,
        errors: [{
          error: (error as Error).message
        }]
      };
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
