export type Currency = 'USD' | 'EUR' | 'GBP' | 'CRC';
export type Language = 'es' | 'en';

export interface Expense {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  description: string;
  category: string;
  date: string;
  payment_method: string;
  created_at?: string;
  updated_at?: string;
}

export interface Income {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  source: string;
  category: string;
  date: string;
  description?: string;
  payment_method?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  currency: string;
  deadline: string;
  category: string;
  created_at?: string;
  updated_at?: string;
}

export interface Category {
  id: string;
  user_id?: string;
  name: string;
  icon?: string;
  color?: string;
  type?: 'expense' | 'income';
  is_default?: boolean;
}

export type RecurringFrequency = 'biweekly' | 'monthly' | 'weekly' | 'yearly';
export type BiweeklyType = '15_and_last_day' | 'every_15_days';

export interface RecurringTransaction {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  description?: string;
  source?: string;
  category: string;
  frequency: RecurringFrequency;
  biweekly_type?: BiweeklyType;
  billing_day?: number;
  auto_register?: boolean;
  start_date: string;
  end_date?: string;
  next_due_date?: string;
  is_active: boolean;
  payment_method?: string;
  last_executed_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface FinancialSummary {
  total_expenses: number;
  total_incomes: number;
  net_savings: number;
  savings_rate: number;
  currency: string;
}

export interface AIInsight {
  type: 'savings' | 'optimization' | 'warning' | 'goal';
  title: string;
  desc: string;
  priority?: 'high' | 'medium' | 'low';
}
