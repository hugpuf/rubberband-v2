
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/integrations/supabase/types";
import { PayrollRun, PayrollItem } from "../../types/payroll";

export abstract class PayrollServiceBase {
  protected supabase: SupabaseClient<Database>;
  protected organizationId: string;

  constructor(client: SupabaseClient<Database>, organizationId: string) {
    this.supabase = client;
    this.organizationId = organizationId;
  }

  protected mapPayrollRunFromDB(data: any): PayrollRun {
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

  protected mapPayrollItemFromDB(data: any): PayrollItem {
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
