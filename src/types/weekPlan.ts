export type ActivityStatus = 'pending' | 'in-progress' | 'completed' | 'skipped';
export type PlanStatus = 'pending' | 'in-progress' | 'completed';
export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
export type TimeSlot = 'morning' | 'afternoon' | 'evening';

export const DAY_LABELS: Record<DayOfWeek, string> = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
};

export const SLOT_LABELS: Record<TimeSlot, string> = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
};

export interface WeekActivity {
  id: string;
  activityId: string;
  day?: DayOfWeek;
  slot: TimeSlot;
  status: ActivityStatus;
  notes: string;
  updatedAt: string;
}

export interface WeekPlan {
  id: string;
  childId: string;
  weekNumber: number;
  year: number;
  startDate: string;
  activities: WeekActivity[];
  importantNotToMiss: string[];
  gotchas: string[];
  parentNotes: string;
  status: PlanStatus;
  updatedAt: string;
}
