import { Database } from "@/integrations/supabase/types";
import { SupabaseClient } from "@supabase/supabase-js";
import { 
  PayrollRun, 
  PayrollItem, 
  CreatePayrollRunParams, 
  UpdatePayrollRunParams,
  CreatePayrollItemParams,
  UpdatePayrollItemParams,
  PayrollRunFilterParams,
  PayrollItemFilterParams,
  PaginatedResponse,
  TaxCalculationResult
} from "../../types";
import { IPayrollService } from "./PayrollServiceInterface";

const PAYROLL_STATUS = {
  DRAFT: 'draft',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  ERROR: 'error',
  CANCELLED: 'cancelled'
} as const;

/**
 * Supabase implementation of the payroll service
 */
export class SupabasePayrollService implements IPayrollService {
  private supabase: SupabaseClient<Database>;
  
  constructor(supabaseClient: SupabaseClient<Database>) {
    this.supabase = supabaseClient;
  }
  
  private mapPayrollRunsFromApi(data: any[]): PayrollRun[] {
    return (data as any[]).map(item => ({
      id: item.id,
      name: item.name,
      organizationId: item.organization_id,
      periodStart: item.period_start,
      periodEnd: item.period_end,
      status: item.status,
      employeeCount: parseInt(item.employee_count) || 0,
      grossAmount: parseFloat(item.gross_amount) || 0,
      taxAmount: parseFloat(item.tax_amount) || 0,
      deductionAmount: parseFloat(item.deduction_amount) || 0,
      netAmount: parseFloat(item.net_amount) || 0,
      paymentDate: item.payment_date,
      notes: item.notes,
      processingErrors: item.processing_errors ? JSON.parse(item.processing_errors) : [],
      createdAt: item.created_at,
      updatedAt: item.updated_at
    }));
  }
  
  private mapPayrollItemsFromApi(data: any[]): PayrollItem[] {
    return (data as any[]).map(item => ({
      id: item.id,
      payrollRunId: item.payroll_run_id,
      employeeId: item.contact_id, // Map from contact_id to employeeId
      employeeName: item.employee_name || 'Unknown Employee',
      grossSalary: parseFloat(item.gross_salary) || 0,
      regularHours: parseFloat(item.regular_hours) || undefined,
      overtimeHours: parseFloat(item.overtime_hours) || undefined,
      hourlyRate: parseFloat(item.hourly_rate) || undefined,
      baseSalary: parseFloat(item.base_salary) || undefined,
      taxAmount: parseFloat(item.tax_amount) || 0,
      deductions: item.deductions ? JSON.parse(item.deductions) : [],
      benefits: item.benefits ? JSON.parse(item.benefits) : [],
      deductionAmount: parseFloat(item.deduction_amount) || 0,
      netSalary: parseFloat(item.net_salary) || 0,
      notes: item.notes,
      status: item.status || 'pending',
      createdAt: item.created_at,
      updatedAt: item.updated_at
    }));
  }
  
  async createPayrollRun(params: CreatePayrollRunParams & { organization_id?: string }): Promise<PayrollRun> {
    try {
      const { employeeIds, ...payrollRunParams } = params;
      
      const payrollData = {
        name: params.name,
        organization_id: params.organizationId || params.organization_id, // Handle both property names
        period_start: params.periodStart,
        period_end: params.periodEnd,
        status: params.status || PAYROLL_STATUS.DRAFT,
        payment_date: params.paymentDate,
        gross_amount: 0,
        tax_amount: 0,
        deduction_amount: 0,
        net_amount: 0,
        employee_count: 0,
        notes: params.notes
      };
      
      const { data, error } = await this.supabase
        .from('payroll_runs')
        .insert([payrollData])
        .select()
        .single();
      
      if (error) {
        console.error("Error creating payroll run:", error);
        throw new Error(error.message);
      }
      
      return this.mapPayrollRunsFromApi([data])[0];
    } catch (error: any) {
      console.error("Error creating payroll run:", error);
      throw new Error(error.message);
    }
  }
  
  async getPayrollRuns(filters?: PayrollRunFilterParams): Promise<PaginatedResponse<PayrollRun>> {
    try {
      let query = this.supabase
        .from('payroll_runs')
        .select('*, count:(*, exact:true)');
      
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      
      if (filters?.startDate) {
        query = query.gte('period_start', filters.startDate);
      }
      
      if (filters?.endDate) {
        query = query.lte('period_end', filters.endDate);
      }
      
      if (filters?.search) {
        query = query.ilike('name', `%${filters.search}%`);
      }
      
      const page = filters?.page || 1;
      const limit = filters?.limit || 10;
      const startIndex = (page - 1) * limit;
      const endIndex = page * limit - 1;
      
      query = query.range(startIndex, endIndex);
      
      const { data, error, count } = await query;
      
      if (error) {
        console.error("Error fetching payroll runs:", error);
        throw new Error(error.message);
      }
      
      const total = count || 0;
      const totalPages = Math.ceil(total / limit);
      
      return {
        data: this.mapPayrollRunsFromApi(data || []),
        total,
        page,
        limit,
        totalPages
      };
    } catch (error: any) {
      console.error("Error fetching payroll runs:", error);
      throw new Error(error.message);
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
        console.error("Error fetching payroll run:", error);
        return null;
      }
      
      return this.mapPayrollRunsFromApi([data])[0] || null;
    } catch (error: any) {
      console.error("Error fetching payroll run:", error);
      return null;
    }
  }
  
  async updatePayrollRun(id: string, updates: UpdatePayrollRunParams): Promise<PayrollRun> {
    try {
      const dbUpdates: any = {};
      
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.organizationId !== undefined) dbUpdates.organization_id = updates.organizationId;
      if (updates.periodStart !== undefined) dbUpdates.period_start = updates.periodStart;
      if (updates.periodEnd !== undefined) dbUpdates.period_end = updates.periodEnd;
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.employeeCount !== undefined) dbUpdates.employee_count = updates.employeeCount;
      if (updates.grossAmount !== undefined) dbUpdates.gross_amount = updates.grossAmount;
      if (updates.taxAmount !== undefined) dbUpdates.tax_amount = updates.taxAmount;
      if (updates.deductionAmount !== undefined) dbUpdates.deduction_amount = updates.deductionAmount;
      if (updates.netAmount !== undefined) dbUpdates.net_amount = updates.netAmount;
      if (updates.paymentDate !== undefined) dbUpdates.payment_date = updates.paymentDate;
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
      if (updates.processingErrors !== undefined) dbUpdates.processing_errors = JSON.stringify(updates.processingErrors);
      
      const { data, error } = await this.supabase
        .from('payroll_runs')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error("Error updating payroll run:", error);
        throw new Error(error.message);
      }
      
      return this.mapPayrollRunsFromApi([data])[0];
    } catch (error: any) {
      console.error("Error updating payroll run:", error);
      throw new Error(error.message);
    }
  }
  
  async deletePayrollRun(id: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('payroll_runs')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error("Error deleting payroll run:", error);
        return false;
      }
      
      return true;
    } catch (error: any) {
      console.error("Error deleting payroll run:", error);
      return false;
    }
  }
  
  async processPayrollRun(id: string): Promise<PayrollRun> {
    try {
      const { data, error } = await this.supabase
        .from('payroll_runs')
        .update({
          status: PAYROLL_STATUS.PROCESSING
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error("Error processing payroll run:", error);
        throw new Error(error.message);
      }
      
      return this.mapPayrollRunsFromApi([data])[0];
    } catch (error: any) {
      console.error("Error processing payroll run:", error);
      throw new Error(error.message);
    }
  }
  
  async finalizePayrollRun(id: string): Promise<PayrollRun> {
    try {
      const { data, error } = await this.supabase
        .from('payroll_runs')
        .update({
          status: PAYROLL_STATUS.COMPLETED
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error("Error finalizing payroll run:", error);
        throw new Error(error.message);
      }
      
      return this.mapPayrollRunsFromApi([data])[0];
    } catch (error: any) {
      console.error("Error finalizing payroll run:", error);
      throw new Error(error.message);
    }
  }
  
  async createPayrollItem(params: CreatePayrollItemParams): Promise<PayrollItem> {
    try {
      const dbItem = {
        payroll_run_id: params.payrollRunId,
        contact_id: params.employeeId, // Map employeeId to contact_id
        contact_type: 'employee',
        employee_name: params.employeeName,
        gross_salary: params.grossSalary,
        regular_hours: params.regularHours,
        overtime_hours: params.overtimeHours,
        hourly_rate: params.hourlyRate,
        base_salary: params.baseSalary,
        tax_amount: params.taxAmount,
        deductions: JSON.stringify(params.deductions),
        benefits: JSON.stringify(params.benefits),
        deduction_amount: params.deductionAmount,
        net_salary: params.netSalary,
        notes: params.notes,
        status: params.status || 'pending'
      };
      
      const { data, error } = await this.supabase
        .from('payroll_items')
        .insert([dbItem])
        .select()
        .single();
      
      if (error) {
        console.error("Error creating payroll item:", error);
        throw new Error(error.message);
      }
      
      return this.mapPayrollItemsFromApi([data])[0];
    } catch (error: any) {
      console.error("Error creating payroll item:", error);
      throw new Error(error.message);
    }
  }
  
  async getPayrollItems(filters?: PayrollItemFilterParams): Promise<PaginatedResponse<PayrollItem>> {
    try {
      let query = this.supabase
        .from('payroll_items')
        .select('*');
      
      if (filters?.payrollRunId) {
        query = query.eq('payroll_run_id', filters.payrollRunId);
      }
      
      if (filters?.employeeId) {
        query = query.eq('contact_id', filters.employeeId);
      }
      
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      
      if (filters?.search) {
        query = query.ilike('employee_name', `%${filters.search}%`);
      }
      
      const page = filters?.page || 1;
      const limit = filters?.limit || 10;
      const startIndex = (page - 1) * limit;
      const endIndex = page * limit - 1;
      
      const countQuery = this.supabase
        .from('payroll_items')
        .select('*', { count: 'exact' });
        
      if (filters?.payrollRunId) {
        countQuery.eq('payroll_run_id', filters.payrollRunId);
      }
      if (filters?.employeeId) {
        countQuery.eq('contact_id', filters.employeeId);
      }
      if (filters?.status) {
        countQuery.eq('status', filters.status);
      }
      if (filters?.search) {
        countQuery.ilike('employee_name', `%${filters.search}%`);
      }
      
      const { count } = await countQuery;
      
      const { data, error } = await query.range(startIndex, endIndex);
      
      if (error) {
        console.error("Error fetching payroll items:", error);
        throw new Error(error.message);
      }
      
      const total = count || 0;
      const totalPages = Math.ceil(total / limit);
      
      return {
        data: this.mapPayrollItemsFromApi(data || []),
        total,
        page,
        limit,
        totalPages
      };
    } catch (error: any) {
      console.error("Error fetching payroll items:", error);
      throw new Error(error.message);
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
        console.error("Error fetching payroll item:", error);
        return null;
      }
      
      return this.mapPayrollItemsFromApi([data])[0] || null;
    } catch (error: any) {
      console.error("Error fetching payroll item:", error);
      return null;
    }
  }
  
  async getPayrollItemsByRunId(runId: string): Promise<PayrollItem[]> {
    try {
      const { data, error } = await this.supabase
        .from('payroll_items')
        .select('*')
        .eq('payroll_run_id', runId);
      
      if (error) {
        console.error("Error fetching payroll items by run id:", error);
        return [];
      }
      
      return this.mapPayrollItemsFromApi(data || []);
    } catch (error: any) {
      console.error("Error fetching payroll items by run id:", error);
      return [];
    }
  }
  
  async updatePayrollItem(id: string, updates: UpdatePayrollItemParams): Promise<PayrollItem> {
    try {
      const { data, error } = await this.supabase
        .from('payroll_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error("Error updating payroll item:", error);
        throw new Error(error.message);
      }
      
      return this.mapPayrollItemsFromApi([data])[0];
    } catch (error: any) {
      console.error("Error updating payroll item:", error);
      throw new Error(error.message);
    }
  }
  
  async deletePayrollItem(id: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('payroll_items')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error("Error deleting payroll item:", error);
        return false;
      }
      
      return true;
    } catch (error: any) {
      console.error("Error deleting payroll item:", error);
      return false;
    }
  }
  
  async calculateTaxes(grossAmount: number, employeeId: string): Promise<TaxCalculationResult> {
    return {
      federalTax: grossAmount * 0.25,
      stateTax: grossAmount * 0.05,
      localTax: 0,
      medicareTax: grossAmount * 0.02,
      socialSecurityTax: grossAmount * 0.062,
      totalTax: grossAmount * (0.25 + 0.05 + 0.02 + 0.062)
    };
  }
  
  async recalculatePayrollItem(id: string): Promise<PayrollItem> {
    try {
      const payrollItem = await this.getPayrollItemById(id);
      
      if (!payrollItem) {
        throw new Error("Payroll item not found");
      }
      
      const taxResult = await this.calculateTaxes(payrollItem.grossSalary, payrollItem.employeeId);
      
      const updatedPayrollItem = {
        ...payrollItem,
        taxAmount: taxResult.totalTax,
        netSalary: payrollItem.grossSalary - taxResult.totalTax - payrollItem.deductionAmount
      };
      
      return await this.updatePayrollItem(id, updatedPayrollItem);
    } catch (error: any) {
      console.error("Error recalculating payroll item:", error);
      throw new Error(error.message);
    }
  }
  
  async recalculatePayrollRun(id: string): Promise<PayrollRun> {
    try {
      const payrollRun = await this.getPayrollRunById(id);
      
      if (!payrollRun) {
        throw new Error("Payroll run not found");
      }
      
      const payrollItems = await this.getPayrollItemsByRunId(id);
      
      let totalGross = 0;
      let totalTax = 0;
      let totalDeduction = 0;
      let totalNet = 0;
      
      for (const item of payrollItems) {
        const recalculatedItem = await this.recalculatePayrollItem(item.id);
        totalGross += recalculatedItem.grossSalary;
        totalTax += recalculatedItem.taxAmount;
        totalDeduction += recalculatedItem.deductionAmount;
        totalNet += recalculatedItem.netSalary;
      }
      
      const updatedPayrollRun = {
        ...payrollRun,
        grossAmount: totalGross,
        taxAmount: totalTax,
        deductionAmount: totalDeduction,
        netAmount: totalNet,
        employeeCount: payrollItems.length
      };
      
      return await this.updatePayrollRun(id, updatedPayrollRun);
    } catch (error: any) {
      console.error("Error recalculating payroll run:", error);
      throw new Error(error.message);
    }
  }
  
  async exportPayrollRun(id: string, format: 'csv' | 'pdf' | 'json'): Promise<string> {
    try {
      const payrollRun = await this.getPayrollRunById(id);
      
      if (!payrollRun) {
        throw new Error("Payroll run not found");
      }
      
      const payrollItems = await this.getPayrollItemsByRunId(id);
      
      if (format === 'json') {
        return JSON.stringify({ payrollRun, payrollItems }, null, 2);
      }
      
      let csvContent = "data:text/csv;charset=utf-8,";
      
      if (format === 'csv') {
        csvContent += "Payroll Run ID,Name,Period Start,Period End,Status,Employee Count,Gross Amount,Tax Amount,Deduction Amount,Net Amount,Payment Date,Notes\n";
        csvContent += `${payrollRun.id},${payrollRun.name},${payrollRun.periodStart},${payrollRun.periodEnd},${payrollRun.status},${payrollRun.employeeCount},${payrollRun.grossAmount},${payrollRun.taxAmount},${payrollRun.deductionAmount},${payrollRun.netAmount},${payrollRun.paymentDate},${payrollRun.notes}\n`;
        
        csvContent += "\nPayroll Item ID,Employee ID,Employee Name,Gross Salary,Tax Amount,Deductions,Net Salary,Status\n";
        payrollItems.forEach(item => {
          csvContent += `${item.id},${item.employeeId},${item.employeeName},${item.grossSalary},${item.taxAmount},${item.deductionAmount},${item.netSalary},${item.status}\n`;
        });
        
        return encodeURIComponent(csvContent);
      }
      
      if (format === 'pdf') {
        return "PDF content would be generated here";
      }
      
      throw new Error("Invalid format specified");
    } catch (error: any) {
      console.error("Error exporting payroll run:", error);
      throw new Error(error.message);
    }
  }
  
  async importPayrollItems(runId: string, data: any[]): Promise<{ success: boolean; imported: number; errors: any[] }> {
    try {
      let importedCount = 0;
      const errors: any[] = [];
      
      for (const itemData of data) {
        try {
          if (!itemData.employeeId || !itemData.grossSalary) {
            errors.push({ message: "Missing employeeId or grossSalary", item: itemData });
            continue;
          }
          
          const createParams: CreatePayrollItemParams = {
            payrollRunId: runId,
            employeeId: itemData.employeeId,
            employeeName: itemData.employeeName || 'Unknown',
            grossSalary: parseFloat(itemData.grossSalary) || 0,
            regularHours: parseFloat(itemData.regularHours) || undefined,
            overtimeHours: parseFloat(itemData.overtimeHours) || undefined,
            hourlyRate: parseFloat(itemData.hourlyRate) || undefined,
            taxAmount: 0,
            deductions: [],
            benefits: [],
            deductionAmount: 0,
            netSalary: 0
          };
          
          await this.createPayrollItem(createParams);
          importedCount++;
        } catch (error: any) {
          errors.push({ message: error.message, item: itemData });
        }
      }
      
      return {
        success: errors.length === 0,
        imported: importedCount,
        errors: errors
      };
    } catch (error: any) {
      console.error("Error importing payroll items:", error);
      return {
        success: false,
        imported: 0,
        errors: [{ message: error.message }]
      };
    }
  }
}
