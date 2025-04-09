
import { Invoice, InvoiceItem, Bill, BillItem } from "../types";

/**
 * Maps API invoice item data to our application format
 */
export const mapInvoiceItemFromApi = (data: any): InvoiceItem => ({
  id: data.id,
  description: data.description,
  quantity: data.quantity,
  unitPrice: data.unit_price,
  taxRate: data.tax_rate || 0,
  amount: data.amount || 0,
  accountId: data.account_id || "5",
});

/**
 * Maps API invoice data to our application format
 */
export const mapInvoiceFromApi = (data: any): Invoice => {
  // Map API status to our application status
  let mappedStatus: Invoice['status'];
  switch(data.status) {
    case "posted":
      mappedStatus = "sent";
      break;
    case "draft":
      mappedStatus = "draft";
      break;
    case "paid":
      mappedStatus = "paid";
      break;
    case "overdue":
      mappedStatus = "overdue";
      break;
    case "cancelled":
      mappedStatus = "cancelled";
      break;
    case "partially_paid":
      mappedStatus = "partially_paid";
      break;
    default:
      mappedStatus = "draft";
  }

  return {
    id: data.id,
    invoiceNumber: data.invoice_number,
    customerId: data.contact_id || "",
    customerName: data.contact_name || "Unknown Customer",
    notes: data.notes,
    status: mappedStatus,
    issueDate: data.issue_date,
    dueDate: data.due_date,
    subtotal: data.subtotal,
    taxAmount: data.tax_amount,
    total: data.total,
    items: data.items ? data.items.map(mapInvoiceItemFromApi) : [],
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
};

/**
 * Maps our Invoice type to API format for database operations
 */
export const mapInvoiceToApiFormat = (invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>): any => {
  console.log("Mapping invoice to API format:", invoice);
  
  // Create a clean object with only the fields needed by the database
  const mappedInvoice = {
    invoice_number: invoice.invoiceNumber,
    contact_id: invoice.customerId,
    contact_name: invoice.customerName,
    notes: invoice.notes,
    status: invoice.status,
    issue_date: invoice.issueDate,
    due_date: invoice.dueDate,
    subtotal: invoice.subtotal,
    tax_amount: invoice.taxAmount,
    total: invoice.total
  };
  
  console.log("Mapped invoice format:", mappedInvoice);
  return mappedInvoice;
};

/**
 * Maps API bill item data to our application format
 */
export const mapBillItemFromApi = (data: any): BillItem => ({
  id: data.id,
  description: data.description,
  quantity: data.quantity,
  unitPrice: data.unit_price,
  taxRate: data.tax_rate || 0,
  amount: data.amount || 0,
  accountId: data.account_id || "6",
});

/**
 * Maps API bill data to our application format
 */
export const mapBillFromApi = (data: any): Bill => {
  return {
    id: data.id,
    billNumber: data.bill_number,
    vendorId: data.contact_id || "",
    vendorName: data.contact_name || data.vendor_name || "Unknown Vendor",
    notes: data.notes,
    status: data.status,
    issueDate: data.issue_date,
    dueDate: data.due_date,
    subtotal: data.subtotal,
    taxAmount: data.tax_amount,
    total: data.total,
    items: data.items ? data.items.map(mapBillItemFromApi) : [],
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
};

/**
 * Maps our Bill type to API format for database operations
 */
export const mapBillToApiFormat = (bill: Omit<Bill, 'id' | 'createdAt' | 'updatedAt'>): any => {
  console.log("Mapping bill to API format:", bill);
  
  // Create a clean object with only the fields needed by the database
  const mappedBill = {
    bill_number: bill.billNumber,
    contact_id: bill.vendorId,
    contact_name: bill.vendorName,
    notes: bill.notes,
    status: bill.status,
    issue_date: bill.issueDate,
    due_date: bill.dueDate,
    subtotal: bill.subtotal,
    tax_amount: bill.taxAmount,
    total: bill.total
  };
  
  console.log("Mapped bill format:", mappedBill);
  return mappedBill;
};

// Add mappers for transactions
export const mapTransactionLineFromApi = (data: any) => ({
  id: data.id,
  accountId: data.account_id,
  description: data.description || "",
  debitAmount: data.debit_amount || 0,
  creditAmount: data.credit_amount || 0,
  createdAt: data.created_at,
  updatedAt: data.updated_at
});

export const mapTransactionFromApi = (data: any) => ({
  id: data.id,
  date: data.transaction_date,
  description: data.description,
  referenceNumber: data.reference_number || "",
  status: data.status,
  lines: data.lines ? data.lines.map(mapTransactionLineFromApi) : [],
  createdAt: data.created_at,
  updatedAt: data.updated_at
});

export const mapTransactionToApiFormat = (transaction: any) => {
  console.log("Mapping transaction to API format:", transaction);
  
  const mappedTransaction = {
    transaction_date: transaction.date,
    description: transaction.description,
    reference_number: transaction.referenceNumber,
    status: transaction.status,
  };
  
  console.log("Mapped transaction format:", mappedTransaction);
  return mappedTransaction;
};

export const mapTransactionLineToApiFormat = (line: any, transactionId: string) => {
  return {
    transaction_id: transactionId,
    account_id: line.accountId,
    description: line.description,
    debit_amount: line.debitAmount || 0,
    credit_amount: line.creditAmount || 0
  };
};
