export type ExpenseCategory =
  | "Alimentación"
  | "Transporte"
  | "Servicios"
  | "Entretenimiento"
  | "Salud"
  | "Metas"
  | "Otros"
  | (string & {});

export interface Expense {
  id: string;
  amount: number;
  currency: string;
  description: string;
  category: ExpenseCategory;
  date: Date | string; // Use Date for client logic, string for JSON compatibility
  payment_method: string;
}

export type IncomeSource =
  | "Salario"
  | "Freelance"
  | "Inversiones"
  | "Regalo"
  | "Otros"
  | (string & {});

export interface Income {
  id: string;
  amount: number;
  currency: string;
  description: string;
  source: IncomeSource;
  date: Date | string;
  payment_method: string;
}

export interface Goal {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline: Date | string;
  category: string;
}

export interface Category {
  id: string;
  user_id?: string;
  name: string;
  type: "expense" | "income";
  color?: string;
  icon?: string;
  is_default: boolean;
  created_at?: string;
}

export type RecurringFrequency = "biweekly" | "monthly" | "weekly" | "yearly";
export type BiweeklyType = "15_and_last_day" | "every_15_days";

export interface RecurringExpense {
  id: string;
  user_id?: string;
  description: string;
  amount: number;
  currency: string;
  category: ExpenseCategory;
  payment_method: string;
  frequency: RecurringFrequency;
  biweekly_type?: BiweeklyType;
  billing_day?: number;
  start_date: string | Date;
  end_date?: string | Date | null;
  next_due_date: string | Date;
  last_executed_at?: string | Date | null;
  is_active: boolean;
  auto_register: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface RecurringSyncResult {
  processed_count: number;
  expenses: Expense[];
}

