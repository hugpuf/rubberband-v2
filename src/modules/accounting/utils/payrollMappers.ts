
import { 
  PayrollRun, 
  PayrollItem, 
  CreatePayrollRunParams, 
  UpdatePayrollRunParams,
  CreatePayrollItemParams,
  UpdatePayrollItemParams
} from "../types";

/**
 * Maps a payroll run from the API format to the application model
 */
export const mapPayrollRunFromApi = (data: any): PayrollRun => {
  return {
    id: data.id,
    name: data.name,
    organizationId: data.organization_id,
    periodStart: data.period_start,
    periodEnd: data.period_end,
    status: data.status,
    employeeCount: data.employee_count,
    grossAmount: data.gross_amount,
    taxAmount: data.tax_amount,
    deductionAmount: data.deduction_amount,
    netAmount: data.net_amount,
    paymentDate: data.payment_date,
    notes: data.notes,
    processingErrors: data.processing_errors,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
};

/**
 * Maps a payroll run from the application model to the API format
 */
export const mapPayrollRunToApiFormat = (payrollRun: Partial<PayrollRun>): any => {
  const result: any = {};

  if (payrollRun.name !== undefined) result.name = payrollRun.name;
  if (payrollRun.organizationId !== undefined) result.organization_id = payrollRun.organizationId;
  if (payrollRun.periodStart !== undefined) result.period_start = payrollRun.periodStart;
  if (payrollRun.periodEnd !== undefined) result.period_end = payrollRun.periodEnd;
  if (payrollRun.status !== undefined) result.status = payrollRun.status;
  if (payrollRun.employeeCount !== undefined) result.employee_count = payrollRun.employeeCount;
  if (payrollRun.grossAmount !== undefined) result.gross_amount = payrollRun.grossAmount;
  if (payrollRun.taxAmount !== undefined) result.tax_amount = payrollRun.taxAmount;
  if (payrollRun.deductionAmount !== undefined) result.deduction_amount = payrollRun.deductionAmount;
  if (payrollRun.netAmount !== undefined) result.net_amount = payrollRun.netAmount;
  if (payrollRun.paymentDate !== undefined) result.payment_date = payrollRun.paymentDate;
  if (payrollRun.notes !== undefined) result.notes = payrollRun.notes;
  if (payrollRun.processingErrors !== undefined) result.processing_errors = payrollRun.processingErrors;

  return result;
};

/**
 * Maps a payroll item from the API format to the application model
 */
export const mapPayrollItemFromApi = (data: any): PayrollItem => {
  return {
    id: data.id,
    payrollRunId: data.payroll_run_id,
    employeeId: data.contact_id,
    employeeName: data.employee_name || 'Unknown Employee',
    grossSalary: data.gross_salary,
    regularHours: data.regular_hours,
    overtimeHours: data.overtime_hours,
    hourlyRate: data.hourly_rate,
    baseSalary: data.base_salary,
    taxAmount: data.tax_amount,
    deductions: data.deductions || [],
    benefits: data.benefits || [],
    deductionAmount: data.deduction_amount,
    netSalary: data.net_salary,
    notes: data.notes,
    status: data.status,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
};

/**
 * Maps a payroll item from the application model to the API format
 */
export const mapPayrollItemToApiFormat = (payrollItem: Partial<PayrollItem>): any => {
  const result: any = {};

  if (payrollItem.payrollRunId !== undefined) result.payroll_run_id = payrollItem.payrollRunId;
  if (payrollItem.employeeId !== undefined) result.contact_id = payrollItem.employeeId;
  if (payrollItem.grossSalary !== undefined) result.gross_salary = payrollItem.grossSalary;
  if (payrollItem.regularHours !== undefined) result.regular_hours = payrollItem.regularHours;
  if (payrollItem.overtimeHours !== undefined) result.overtime_hours = payrollItem.overtimeHours;
  if (payrollItem.hourlyRate !== undefined) result.hourly_rate = payrollItem.hourlyRate;
  if (payrollItem.baseSalary !== undefined) result.base_salary = payrollItem.baseSalary;
  if (payrollItem.taxAmount !== undefined) result.tax_amount = payrollItem.taxAmount;
  if (payrollItem.deductions !== undefined) result.deductions = payrollItem.deductions;
  if (payrollItem.benefits !== undefined) result.benefits = payrollItem.benefits;
  if (payrollItem.deductionAmount !== undefined) result.deduction_amount = payrollItem.deductionAmount;
  if (payrollItem.netSalary !== undefined) result.net_salary = payrollItem.netSalary;
  if (payrollItem.notes !== undefined) result.notes = payrollItem.notes;
  if (payrollItem.status !== undefined) result.status = payrollItem.status;

  return result;
};
