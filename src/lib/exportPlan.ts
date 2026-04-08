import type { WeekPlan, MonthPlan, YearPlan, Activity } from '../types';

function exportWeekActivities(plan: WeekPlan, getActivity: (id: string) => Activity | undefined) {
  return plan.activities.map((wa) => {
    const activity = getActivity(wa.activityId);
    return {
      activityId: wa.activityId,
      activityTitle: activity?.title ?? 'Unknown',
      day: wa.day,
      slot: wa.slot,
      status: wa.status,
      notes: wa.notes,
    };
  });
}

export function exportWeekPlan(plan: WeekPlan, getActivity: (id: string) => Activity | undefined) {
  return {
    type: 'weekly' as const,
    weekNumber: plan.weekNumber,
    year: plan.year,
    activities: exportWeekActivities(plan, getActivity),
    importantNotToMiss: plan.importantNotToMiss,
    gotchas: plan.gotchas,
    parentNotes: plan.parentNotes,
    status: plan.status,
  };
}

export function exportMonthPlan(
  monthPlan: MonthPlan,
  weekPlans: WeekPlan[],
  getActivity: (id: string) => Activity | undefined,
) {
  const weeks = monthPlan.weekPlanIds
    .map((wpId) => weekPlans.find((wp) => wp.id === wpId))
    .filter((wp): wp is WeekPlan => !!wp)
    .map((wp) => ({
      weekNumber: wp.weekNumber,
      activities: exportWeekActivities(wp, getActivity),
      importantNotToMiss: wp.importantNotToMiss,
      gotchas: wp.gotchas,
    }));

  return {
    type: 'monthly' as const,
    month: monthPlan.month,
    year: monthPlan.year,
    theme: monthPlan.theme,
    supportThemes: monthPlan.supportThemes,
    mustNotMiss: monthPlan.mustNotMiss,
    gotchaRisk: monthPlan.gotchaRisk,
    weeks,
    notes: monthPlan.notes,
    status: monthPlan.status,
  };
}

export function exportYearPlan(
  yearPlan: YearPlan,
  monthPlans: MonthPlan[],
  weekPlans: WeekPlan[],
  getActivity: (id: string) => Activity | undefined,
) {
  const months = yearPlan.monthPlanIds
    .map((mpId) => monthPlans.find((mp) => mp.id === mpId))
    .filter((mp): mp is MonthPlan => !!mp)
    .map((mp) => exportMonthPlan(mp, weekPlans, getActivity));

  return {
    type: 'yearly' as const,
    year: yearPlan.year,
    ageBand: yearPlan.ageBand,
    goals: yearPlan.goals,
    months,
    notes: yearPlan.notes,
    status: yearPlan.status,
  };
}

export function downloadJSON(data: unknown, filename: string) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
