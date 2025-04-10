
import { BaseEntity } from "./common";

/**
 * Represents a payroll deduction type (e.g., taxes, insurance, retirement)
 */
export type DeductionType = 'tax' | 'insurance' | 'retirement' | 'other';

/**
 * Represents a payroll benefit type
 */
export type BenefitType = 'health' | 'dental' | 'vision' | 'retirement' | 'bonus' | 'other';

/**
 * Valid payroll run statuses
 */
export type PayrollRunStatus = 'draft' | 'processing' | 'completed' | 'error' | 'cancelled';

// Define the status constants for use as values
export const PAYROLL_RUN_STATUS = {
  DRAFT: 'draft',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  ERROR: 'error',
  CANCELLED: 'cancelled'
} as const;

/**
 * Represents a single deduction in a payroll item
 */
export interface PayrollDeduction {
  id: string;
  name: string;
  type: DeductionType;
  amount: number;
  rate?: number;
  description?: string;
}

/**
 * Represents a single benefit in a payroll item
 */
export interface PayrollBenefit {
  id: string;
  name: string;
  type: BenefitType;
  amount: number;
  description?: string;
}

/**
 * Extended PayrollItem type with more fields
 */
export interface PayrollItem extends BaseEntity {
  id: string;
  payrollRunId: string; // Maps to payroll_run_id in database
  employeeId: string; // Maps to contact_id in database
  employeeName: string;
  grossSalary: number;
  regularHours?: number;
  overtimeHours?: number;
  hourlyRate?: number;
  baseSalary?: number;
  taxAmount: number;
  deductions: PayrollDeduction[];
  benefits?: PayrollBenefit[];
  deductionAmount: number;
  netSalary: number;
  notes?: string;
  status: 'pending' | 'processed' | 'error';
}

/**
 * Parameters for creating a new payroll item
 */
export interface CreatePayrollItemParams {
  payrollRunId: string;
  employeeId: string;
  employeeName: string;
  grossSalary: number;
  regularHours?: number;
  overtimeHours?: number;
  hourlyRate?: number;
  baseSalary?: number;
  taxAmount: number;
  deductions: PayrollDeduction[];
  benefits?: PayrollBenefit[];
  deductionAmount: number;
  netSalary: number;
  notes?: string;
  status?: 'pending' | 'processed' | 'error';
}

/**
 * Parameters for updating a payroll item
 */
export type UpdatePayrollItemParams = Partial<Omit<PayrollItem, 'id' | 'createdAt' | 'updatedAt'>>;

/**
 * Enhanced PayrollRun type
 */
export interface PayrollRun extends BaseEntity {
  id: string;
  name: string;
  organizationId: string;
  periodStart: string;
  periodEnd: string;
  status: PayrollRunStatus;
  employeeCount: number;
  grossAmount: number;
  taxAmount: number;
  deductionAmount: number;
  netAmount: number;
  paymentDate: string;
  notes?: string;
  processingErrors?: string[];
}

/**
 * Parameters for creating a new payroll run
 */
export interface CreatePayrollRunParams {
  name: string;
  organizationId?: string;
  periodStart: string;
  periodEnd: string;
  status?: PayrollRunStatus;
  paymentDate: string;
  notes?: string;
  employeeIds?: string[];
}

/**
 * Parameters for updating a payroll run
 */
export type UpdatePayrollRunParams = Partial<Omit<PayrollRun, 'id' | 'createdAt' | 'updatedAt'>>;

/**
 * Parameters for filtering payroll runs
 */
export interface PayrollRunFilterParams {
  status?: PayrollRunStatus;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

/**
 * Parameters for filtering payroll items
 */
export interface PayrollItemFilterParams {
  payrollRunId?: string;
  employeeId?: string;
  status?: 'pending' | 'processed' | 'error';
  search?: string;
  page?: number;
  limit?: number;
}

/**
 * Tax calculation configuration
 */
export interface TaxCalculationConfig {
  federalTaxRate: number;
  stateTaxRate: number;
  localTaxRate?: number;
  medicareTaxRate: number;
  socialSecurityTaxRate: number;
  thresholds?: {
    federalTax: { [incomeLevel: string]: number };
    stateTax?: { [incomeLevel: string]: number };
  };
}

/**
 * Result of a tax calculation
 */
export interface TaxCalculationResult {
  federalTax: number;
  stateTax: number;
  localTax: number;
  medicareTax: number;
  socialSecurityTax: number;
  totalTax: number;
}
