import type { AgeBand } from './child';

export interface YearPlan {
  id: string;
  childId: string;
  year: number;
  ageBand: AgeBand;
  goals: string[];
  monthPlanIds: string[];
  notes: string;
  status: 'pending' | 'in-progress' | 'completed';
  createdAt: string;
  updatedAt: string;
}
