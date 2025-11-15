// types/transactions.ts

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  type: TransactionType;
  category: string;
  description: string | null;
  date: Date;
  created_at: Date;
}

export interface CreateTransactionInput {
  amount: number;
  type: TransactionType;
  category: string;
  description?: string;
  date: string;
}

export interface TransactionsResponse {
  success: boolean;
  transactions: Transaction[];
}

export interface CreateTransactionResponse {
  success: boolean;
  transaction: Transaction;
  message: string;
}

export const EXPENSE_CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Entertainment',
  'Bills & Utilities',
  'Health',
  'Other'
] as const;

export const INCOME_CATEGORIES = [
  'Salary',
  'Freelance',
  'Investment',
  'Business',
  'Gift',
  'Refund',
  'Other'
] as const;

export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number];
export type IncomeCategory = typeof INCOME_CATEGORIES[number];


