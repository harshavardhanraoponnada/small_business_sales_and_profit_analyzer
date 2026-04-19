import type { Expense } from '@/types';

export type ExpenseLike = Partial<Expense> & {
  category?: string;
  date?: string;
  amount?: number | string;
  description?: string;
  file?: string;
};

export type ExpenseThemePalette = {
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  accent: string;
  error: string;
  success: string;
  accentSoft?: string;
  isDarkMode: boolean;
};

export type ExpenseCategoryMeta = {
  key?: string;
  name?: string;
  color: string;
  icon: string;
};

export type ExpenseCategoryMetaMap = Record<string, ExpenseCategoryMeta>;

export type CategoryAmount = {
  category: string;
  amount: number;
};

export type MonthlyCategoryPoint = {
  month: string;
  total: number;
  categories: Record<string, number>;
};
