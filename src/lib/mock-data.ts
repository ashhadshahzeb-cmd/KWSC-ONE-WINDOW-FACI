export interface BankAccount {
  id: string;
  bankName: string;
  accountTitle: string;
  accountNumber: string;
  maskedNumber: string;
  currency: string;
  balance: number;
  openingBalance: number;
  status: 'active' | 'inactive';
  color: string;
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'debit' | 'credit';
  category: string;
  accountCode: string;
  bankAccountId: string;
  bankName: string;
  status: 'approved' | 'pending' | 'reconciled';
  reference: string;
}

export interface LedgerEntry {
  id: string;
  date: string;
  transactionId: string;
  accountCode: string;
  accountName: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  bankName: string;
}

export interface AccountNode {
  code: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'income' | 'expense';
  balance: number;
  parentCode: string | null;
  children?: AccountNode[];
}

export const bankAccounts: BankAccount[] = [
  { id: 'b1', bankName: 'HBL', accountTitle: 'Main Operations', accountNumber: '00427901234501', maskedNumber: '****4501', currency: 'PKR', balance: 4250000, openingBalance: 3000000, status: 'active', color: '#0ea5e9' },
  { id: 'b2', bankName: 'Meezan Bank', accountTitle: 'Islamic Finance', accountNumber: '02109876543210', maskedNumber: '****3210', currency: 'PKR', balance: 2870000, openingBalance: 2000000, status: 'active', color: '#22c55e' },
  { id: 'b3', bankName: 'UBL', accountTitle: 'Payroll Account', accountNumber: '11234567890123', maskedNumber: '****0123', currency: 'PKR', balance: 1560000, openingBalance: 1500000, status: 'active', color: '#f59e0b' },
  { id: 'b4', bankName: 'Standard Chartered', accountTitle: 'Foreign Currency', accountNumber: '56789012345678', maskedNumber: '****5678', currency: 'USD', balance: 45200, openingBalance: 50000, status: 'active', color: '#8b5cf6' },
  { id: 'b5', bankName: 'Petty Cash', accountTitle: 'Office Cash', accountNumber: 'CASH-001', maskedNumber: 'CASH', currency: 'PKR', balance: 125000, openingBalance: 100000, status: 'active', color: '#ec4899' },
];

export const transactions: Transaction[] = [
  { id: 't1', date: '2026-03-01', description: 'Client Payment - ABC Corp', amount: 850000, type: 'credit', category: 'Revenue', accountCode: '4001', bankAccountId: 'b1', bankName: 'HBL', status: 'reconciled', reference: 'INV-2026-0142' },
  { id: 't2', date: '2026-03-01', description: 'Office Rent - March', amount: 180000, type: 'debit', category: 'Rent Expense', accountCode: '5201', bankAccountId: 'b1', bankName: 'HBL', status: 'approved', reference: 'EXP-0301' },
  { id: 't3', date: '2026-02-28', description: 'Staff Salaries - February', amount: 920000, type: 'debit', category: 'Salary Expense', accountCode: '5101', bankAccountId: 'b3', bankName: 'UBL', status: 'reconciled', reference: 'PAY-FEB-2026' },
  { id: 't4', date: '2026-02-28', description: 'Consulting Fee - XYZ Ltd', amount: 450000, type: 'credit', category: 'Revenue', accountCode: '4001', bankAccountId: 'b2', bankName: 'Meezan Bank', status: 'approved', reference: 'INV-2026-0139' },
  { id: 't5', date: '2026-02-27', description: 'Server Hosting - AWS', amount: 3200, type: 'debit', category: 'IT Expense', accountCode: '5301', bankAccountId: 'b4', bankName: 'Standard Chartered', status: 'reconciled', reference: 'AWS-FEB' },
  { id: 't6', date: '2026-02-27', description: 'Office Supplies', amount: 35000, type: 'debit', category: 'Office Expense', accountCode: '5401', bankAccountId: 'b5', bankName: 'Petty Cash', status: 'approved', reference: 'PC-027' },
  { id: 't7', date: '2026-02-26', description: 'Electricity Bill', amount: 42000, type: 'debit', category: 'Utilities', accountCode: '5202', bankAccountId: 'b1', bankName: 'HBL', status: 'pending', reference: 'UTIL-0226' },
  { id: 't8', date: '2026-02-26', description: 'Client Payment - DEF Inc', amount: 1200000, type: 'credit', category: 'Revenue', accountCode: '4001', bankAccountId: 'b1', bankName: 'HBL', status: 'reconciled', reference: 'INV-2026-0137' },
  { id: 't9', date: '2026-02-25', description: 'Insurance Premium', amount: 95000, type: 'debit', category: 'Insurance', accountCode: '5501', bankAccountId: 'b2', bankName: 'Meezan Bank', status: 'approved', reference: 'INS-Q1' },
  { id: 't10', date: '2026-02-25', description: 'Software Licenses', amount: 5800, type: 'debit', category: 'IT Expense', accountCode: '5301', bankAccountId: 'b4', bankName: 'Standard Chartered', status: 'pending', reference: 'SW-FEB' },
  { id: 't11', date: '2026-02-24', description: 'Marketing Campaign', amount: 150000, type: 'debit', category: 'Marketing', accountCode: '5601', bankAccountId: 'b1', bankName: 'HBL', status: 'approved', reference: 'MKT-024' },
  { id: 't12', date: '2026-02-24', description: 'Freelance Payment', amount: 275000, type: 'credit', category: 'Revenue', accountCode: '4002', bankAccountId: 'b2', bankName: 'Meezan Bank', status: 'reconciled', reference: 'INV-2026-0135' },
];

export const ledgerEntries: LedgerEntry[] = [
  { id: 'l1', date: '2026-03-01', transactionId: 't1', accountCode: '1001', accountName: 'Bank - HBL', description: 'Client Payment - ABC Corp', debit: 850000, credit: 0, balance: 4250000, bankName: 'HBL' },
  { id: 'l2', date: '2026-03-01', transactionId: 't1', accountCode: '4001', accountName: 'Service Revenue', description: 'Client Payment - ABC Corp', debit: 0, credit: 850000, balance: 2500000, bankName: 'HBL' },
  { id: 'l3', date: '2026-03-01', transactionId: 't2', accountCode: '5201', accountName: 'Rent Expense', description: 'Office Rent - March', debit: 180000, credit: 0, balance: 540000, bankName: 'HBL' },
  { id: 'l4', date: '2026-03-01', transactionId: 't2', accountCode: '1001', accountName: 'Bank - HBL', description: 'Office Rent - March', debit: 0, credit: 180000, balance: 4070000, bankName: 'HBL' },
  { id: 'l5', date: '2026-02-28', transactionId: 't3', accountCode: '5101', accountName: 'Salary Expense', description: 'Staff Salaries - February', debit: 920000, credit: 0, balance: 2760000, bankName: 'UBL' },
  { id: 'l6', date: '2026-02-28', transactionId: 't3', accountCode: '1003', accountName: 'Bank - UBL', description: 'Staff Salaries - February', debit: 0, credit: 920000, balance: 1560000, bankName: 'UBL' },
  { id: 'l7', date: '2026-02-28', transactionId: 't4', accountCode: '1002', accountName: 'Bank - Meezan', description: 'Consulting Fee - XYZ Ltd', debit: 450000, credit: 0, balance: 2870000, bankName: 'Meezan Bank' },
  { id: 'l8', date: '2026-02-28', transactionId: 't4', accountCode: '4001', accountName: 'Service Revenue', description: 'Consulting Fee - XYZ Ltd', debit: 0, credit: 450000, balance: 2950000, bankName: 'Meezan Bank' },
];

export const chartOfAccounts: AccountNode[] = [
  { code: '1000', name: 'Assets', type: 'asset', balance: 8855000, parentCode: null },
  { code: '1001', name: 'Bank - HBL', type: 'asset', balance: 4250000, parentCode: '1000' },
  { code: '1002', name: 'Bank - Meezan', type: 'asset', balance: 2870000, parentCode: '1000' },
  { code: '1003', name: 'Bank - UBL', type: 'asset', balance: 1560000, parentCode: '1000' },
  { code: '1004', name: 'Bank - SCB (USD)', type: 'asset', balance: 45200, parentCode: '1000' },
  { code: '1005', name: 'Petty Cash', type: 'asset', balance: 125000, parentCode: '1000' },
  { code: '1100', name: 'Accounts Receivable', type: 'asset', balance: 1250000, parentCode: '1000' },
  { code: '1200', name: 'Fixed Assets', type: 'asset', balance: 3500000, parentCode: '1000' },
  { code: '2000', name: 'Liabilities', type: 'liability', balance: 2100000, parentCode: null },
  { code: '2001', name: 'Accounts Payable', type: 'liability', balance: 850000, parentCode: '2000' },
  { code: '2002', name: 'Accrued Expenses', type: 'liability', balance: 450000, parentCode: '2000' },
  { code: '2003', name: 'Tax Payable', type: 'liability', balance: 800000, parentCode: '2000' },
  { code: '3000', name: 'Equity', type: 'equity', balance: 5000000, parentCode: null },
  { code: '3001', name: 'Owner Capital', type: 'equity', balance: 4000000, parentCode: '3000' },
  { code: '3002', name: 'Retained Earnings', type: 'equity', balance: 1000000, parentCode: '3000' },
  { code: '4000', name: 'Income', type: 'income', balance: 2775000, parentCode: null },
  { code: '4001', name: 'Service Revenue', type: 'income', balance: 2500000, parentCode: '4000' },
  { code: '4002', name: 'Consulting Revenue', type: 'income', balance: 275000, parentCode: '4000' },
  { code: '5000', name: 'Expenses', type: 'expense', balance: 1450800, parentCode: null },
  { code: '5101', name: 'Salary Expense', type: 'expense', balance: 920000, parentCode: '5000' },
  { code: '5201', name: 'Rent Expense', type: 'expense', balance: 180000, parentCode: '5000' },
  { code: '5202', name: 'Utilities Expense', type: 'expense', balance: 42000, parentCode: '5000' },
  { code: '5301', name: 'IT Expense', type: 'expense', balance: 9000, parentCode: '5000' },
  { code: '5401', name: 'Office Expense', type: 'expense', balance: 35000, parentCode: '5000' },
  { code: '5501', name: 'Insurance Expense', type: 'expense', balance: 95000, parentCode: '5000' },
  { code: '5601', name: 'Marketing Expense', type: 'expense', balance: 150000, parentCode: '5000' },
];

export const monthlyData = [
  { month: 'Sep', income: 2100000, expenses: 1650000 },
  { month: 'Oct', income: 2400000, expenses: 1800000 },
  { month: 'Nov', income: 1900000, expenses: 1550000 },
  { month: 'Dec', income: 2800000, expenses: 2100000 },
  { month: 'Jan', income: 2200000, expenses: 1700000 },
  { month: 'Feb', income: 2775000, expenses: 1450800 },
];

export const formatCurrency = (amount: number, currency: string = 'PKR'): string => {
  if (currency === 'USD') {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);
  }
  return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }).format(amount);
};

export const formatNumber = (n: number): string => {
  return new Intl.NumberFormat('en-PK').format(n);
};
