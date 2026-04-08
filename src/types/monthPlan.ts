export type MonthNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export const MONTH_LABELS: Record<MonthNumber, string> = {
  1: 'January', 2: 'February', 3: 'March', 4: 'April',
  5: 'May', 6: 'June', 7: 'July', 8: 'August',
  9: 'September', 10: 'October', 11: 'November', 12: 'December',
};

export interface MonthPlan {
  id: string;
  childId: string;
  yearPlanId?: string;
  year: number;
  month: MonthNumber;
  theme: string;
  supportThemes: string[];
  mustNotMiss: string;
  gotchaRisk: string;
  weekPlanIds: string[];
  notes: string;
  status: 'pending' | 'in-progress' | 'completed';
  createdAt: string;
  updatedAt: string;
}
