import type { SkillNode } from './skillNode';

export interface WeekendReview {
  id: string;
  childId: string;
  weekPlanId: string;
  date: string;
  skillScores: Record<SkillNode, number>;
  inProgress: string[];
  pending: string[];
  completed: string[];
  wins: string;
  struggles: string;
  gotchasNoticed: string[];
  importantNextWeek: string[];
  parentNotes: string;
  adjustmentPlan: string;
  createdAt: string;
}
