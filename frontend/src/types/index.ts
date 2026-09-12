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
