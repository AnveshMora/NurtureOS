import { nanoid } from 'nanoid';
import type {
  Activity, ActivityCategory, ActivityDuration, AgeBand,
  WeekPlan, WeekActivity, DayOfWeek, TimeSlot,
  MonthPlan, MonthNumber,
  YearPlan, SkillNode,
} from '../types';

// ======== Import Template Types ========

interface ImportActivityRef {
  activityId: string;
  day?: DayOfWeek;
  slot?: TimeSlot;
}

interface ImportActivityInline {
  inline: true;
  title: string;
  category: ActivityCategory;
  duration?: ActivityDuration;
  materials?: string[];
  instructions?: string[];
  parentPrompts?: string[];
  expectedBehavior?: string;
  commonMistakes?: string[];
  skillMapping?: Partial<Record<SkillNode, number>>;
  ageBands?: AgeBand[];
  day?: DayOfWeek;
  slot?: TimeSlot;
}

type ImportActivity = ImportActivityRef | ImportActivityInline;

function isInlineActivity(a: ImportActivity): a is ImportActivityInline {
  return 'inline' in a && a.inline === true;
}

interface ImportWeekTemplate {
  weekNumber: number;
  activities: ImportActivity[];
  importantNotToMiss?: string[];
  gotchas?: string[];
}

export interface WeeklyImport {
  type: 'weekly';
  weekNumber: number;
  year: number;
  activities: ImportActivity[];
  importantNotToMiss?: string[];
  gotchas?: string[];
}

export interface MonthlyImport {
  type: 'monthly';
  month: MonthNumber;
  year: number;
  theme: string;
  supportThemes?: string[];
  mustNotMiss?: string;
  gotchaRisk?: string;
  weeks: ImportWeekTemplate[];
}

export interface YearlyImport {
  type: 'yearly';
  year: number;
  ageBand: AgeBand;
  goals?: string[];
  months: (Omit<MonthlyImport, 'type' | 'year'> & { month: MonthNumber })[];
}

export type PlanImport = WeeklyImport | MonthlyImport | YearlyImport;

// ======== Preview Types ========

export type PreviewAction = 'create' | 'merge' | 'skip';

export interface PreviewWeek {
  weekNumber: number;
  year: number;
  action: PreviewAction;
  existingActivities: number;
  newActivities: number;
  skippedActivities: number;
  inlineActivities: number;
  details: string;
}

export interface PreviewMonth {
  month: MonthNumber;
  year: number;
  action: PreviewAction;
  theme: string;
  weeks: PreviewWeek[];
}

export interface ImportPreview {
  type: 'weekly' | 'monthly' | 'yearly';
  summary: string;
  totalNewActivities: number;
  totalMergedWeeks: number;
  totalNewWeeks: number;
  totalSkippedActivities: number;
  totalInlineActivities: number;
  weeks: PreviewWeek[];
  months: PreviewMonth[];
  yearAction?: PreviewAction;
  warnings: string[];
  errors: string[];
}

// ======== Store Accessors (passed in to avoid import cycles) ========

export interface StoreAccessors {
  getActivity: (id: string) => Activity | undefined;
  getPlanByWeek: (childId: string, weekNumber: number, year: number) => WeekPlan | undefined;
  getPlanByMonth: (childId: string, month: MonthNumber, year: number) => MonthPlan | undefined;
  getPlanByYear: (childId: string, year: number) => YearPlan | undefined;
  addActivity: (activity: Activity) => void;
  addWeekPlan: (plan: WeekPlan) => void;
  addActivityToWeek: (weekPlanId: string, activity: WeekActivity) => void;
  addMonthPlan: (plan: MonthPlan) => void;
  updateMonthPlan: (id: string, updates: Partial<MonthPlan>) => void;
  addYearPlan: (plan: YearPlan) => void;
  updateYearPlan: (id: string, updates: Partial<YearPlan>) => void;
}

// ======== Validation ========

export function validateImport(json: unknown): { valid: boolean; data?: PlanImport; errors: string[] } {
  const errors: string[] = [];

  if (!json || typeof json !== 'object') {
    return { valid: false, errors: ['Invalid JSON: expected an object'] };
  }

  const obj = json as Record<string, unknown>;

  if (!['weekly', 'monthly', 'yearly'].includes(obj.type as string)) {
    errors.push('Missing or invalid "type" field. Must be "weekly", "monthly", or "yearly".');
    return { valid: false, errors };
  }

  if (obj.type === 'weekly') {
    if (typeof obj.weekNumber !== 'number' || obj.weekNumber < 1 || obj.weekNumber > 53) {
      errors.push('"weekNumber" must be a number between 1-53');
    }
    if (typeof obj.year !== 'number') {
      errors.push('"year" is required');
    }
    if (!Array.isArray(obj.activities) || obj.activities.length === 0) {
      errors.push('"activities" must be a non-empty array');
    }
  }

  if (obj.type === 'monthly') {
    if (typeof obj.month !== 'number' || obj.month < 1 || obj.month > 12) {
      errors.push('"month" must be 1-12');
    }
    if (typeof obj.year !== 'number') {
      errors.push('"year" is required');
    }
    if (typeof obj.theme !== 'string' || !obj.theme) {
      errors.push('"theme" is required');
    }
    if (!Array.isArray(obj.weeks) || obj.weeks.length === 0) {
      errors.push('"weeks" must be a non-empty array');
    }
  }

  if (obj.type === 'yearly') {
    if (typeof obj.year !== 'number') {
      errors.push('"year" is required');
    }
    if (!['2-3', '3-4', '4-5', '5-6'].includes(obj.ageBand as string)) {
      errors.push('"ageBand" must be "2-3", "3-4", "4-5", or "5-6"');
    }
    if (!Array.isArray(obj.months) || obj.months.length === 0) {
      errors.push('"months" must be a non-empty array');
    }
  }

  if (errors.length > 0) return { valid: false, errors };
  return { valid: true, data: obj as unknown as PlanImport, errors: [] };
}

// ======== Preview Generation ========

function previewWeek(
  week: ImportWeekTemplate,
  year: number,
  childId: string,
  stores: Pick<StoreAccessors, 'getActivity' | 'getPlanByWeek'>,
): PreviewWeek {
  const existing = stores.getPlanByWeek(childId, week.weekNumber, year);
  let newActs = 0;
  let skippedActs = 0;
  let inlineActs = 0;

  for (const act of week.activities) {
    if (isInlineActivity(act)) {
      inlineActs++;
      newActs++;
    } else {
      if (existing?.activities.some((a) => a.activityId === act.activityId)) {
        skippedActs++;
      } else {
        newActs++;
      }
    }
  }

  const action: PreviewAction = !existing ? 'create' : newActs > 0 ? 'merge' : 'skip';
  const details = !existing
    ? `New week plan with ${newActs} activities`
    : newActs > 0
      ? `Add ${newActs} activities to existing plan (${existing.activities.length} current)`
      : `All activities already exist — nothing to add`;

  return {
    weekNumber: week.weekNumber,
    year,
    action,
    existingActivities: existing?.activities.length ?? 0,
    newActivities: newActs,
    skippedActivities: skippedActs,
    inlineActivities: inlineActs,
    details,
  };
}

export function generatePreview(
  data: PlanImport,
  childId: string,
  stores: Pick<StoreAccessors, 'getActivity' | 'getPlanByWeek' | 'getPlanByMonth' | 'getPlanByYear'>,
): ImportPreview {
  const warnings: string[] = [];
  const weeks: PreviewWeek[] = [];
  const months: PreviewMonth[] = [];
  let yearAction: PreviewAction | undefined;

  if (data.type === 'weekly') {
    const pw = previewWeek(
      { weekNumber: data.weekNumber, activities: data.activities, importantNotToMiss: data.importantNotToMiss, gotchas: data.gotchas },
      data.year,
      childId,
      stores,
    );
    weeks.push(pw);

    for (const act of data.activities) {
      if (!isInlineActivity(act) && !stores.getActivity(act.activityId)) {
        warnings.push(`Activity "${act.activityId}" not found in library — will be skipped`);
      }
    }
  }

  if (data.type === 'monthly') {
    const existingMonth = stores.getPlanByMonth(childId, data.month, data.year);
    const monthWeeks: PreviewWeek[] = [];

    for (const w of data.weeks) {
      const pw = previewWeek(w, data.year, childId, stores);
      monthWeeks.push(pw);
      weeks.push(pw);
    }

    months.push({
      month: data.month,
      year: data.year,
      action: existingMonth ? 'merge' : 'create',
      theme: data.theme,
      weeks: monthWeeks,
    });
  }

  if (data.type === 'yearly') {
    const existingYear = stores.getPlanByYear(childId, data.year);
    yearAction = existingYear ? 'merge' : 'create';

    for (const m of data.months) {
      const existingMonth = stores.getPlanByMonth(childId, m.month, data.year);
      const monthWeeks: PreviewWeek[] = [];

      for (const w of m.weeks) {
        const pw = previewWeek(w, data.year, childId, stores);
        monthWeeks.push(pw);
        weeks.push(pw);
      }

      months.push({
        month: m.month,
        year: data.year,
        action: existingMonth ? 'merge' : 'create',
        theme: m.theme,
        weeks: monthWeeks,
      });
    }
  }

  const totalNewActivities = weeks.reduce((sum, w) => sum + w.newActivities, 0);
  const totalMergedWeeks = weeks.filter((w) => w.action === 'merge').length;
  const totalNewWeeks = weeks.filter((w) => w.action === 'create').length;
  const totalSkippedActivities = weeks.reduce((sum, w) => sum + w.skippedActivities, 0);
  const totalInlineActivities = weeks.reduce((sum, w) => sum + w.inlineActivities, 0);

  const parts: string[] = [];
  if (totalNewWeeks > 0) parts.push(`${totalNewWeeks} new week(s)`);
  if (totalMergedWeeks > 0) parts.push(`${totalMergedWeeks} merged week(s)`);
  parts.push(`${totalNewActivities} new activities`);
  if (totalSkippedActivities > 0) parts.push(`${totalSkippedActivities} already exist`);
  if (totalInlineActivities > 0) parts.push(`${totalInlineActivities} custom activities`);

  return {
    type: data.type,
    summary: parts.join(' · '),
    totalNewActivities,
    totalMergedWeeks,
    totalNewWeeks,
    totalSkippedActivities,
    totalInlineActivities,
    weeks,
    months,
    yearAction,
    warnings,
    errors: [],
  };
}

// ======== Apply Import ========

function createInlineActivity(act: ImportActivityInline): Activity {
  const fullMapping: Record<SkillNode, number> = {
    curiosity: 0, firstPrinciples: 0, problemSolving: 0,
    communication: 0, grit: 0, arts: 0,
    ...(act.skillMapping ?? {}),
  };

  return {
    id: nanoid(),
    title: act.title,
    category: act.category ?? 'practical-life',
    duration: act.duration ?? '20min',
    materials: act.materials ?? [],
    instructions: act.instructions ?? [],
    parentPrompts: act.parentPrompts ?? [],
    expectedBehavior: act.expectedBehavior ?? '',
    commonMistakes: act.commonMistakes ?? [],
    skillMapping: fullMapping,
    ageBands: act.ageBands ?? ['2-3', '3-4', '4-5', '5-6'],
    isCustom: true,
    createdAt: new Date().toISOString(),
  };
}

function applyWeekActivities(
  weekActivities: ImportActivity[],
  existingPlan: WeekPlan | undefined,
  stores: StoreAccessors,
  weekPlanId: string,
) {
  for (const act of weekActivities) {
    let activityId: string;
    const slot = act.slot ?? 'morning';
    const day = act.day;

    if (isInlineActivity(act)) {
      const newActivity = createInlineActivity(act);
      stores.addActivity(newActivity);
      activityId = newActivity.id;
    } else {
      // Skip if activity doesn't exist in library
      if (!stores.getActivity(act.activityId)) continue;
      activityId = act.activityId;
    }

    // Skip if already in week (merge-safe: never overwrite existing)
    if (existingPlan?.activities.some((a) => a.activityId === activityId)) continue;

    stores.addActivityToWeek(weekPlanId, {
      id: nanoid(),
      activityId,
      day,
      slot,
      status: 'pending',
      notes: '',
      updatedAt: new Date().toISOString(),
    });
  }
}

function applyWeek(
  week: ImportWeekTemplate,
  year: number,
  childId: string,
  stores: StoreAccessors,
): string {
  const existing = stores.getPlanByWeek(childId, week.weekNumber, year);

  if (existing) {
    applyWeekActivities(week.activities, existing, stores, existing.id);
    return existing.id;
  }

  const newPlan: WeekPlan = {
    id: nanoid(),
    childId,
    weekNumber: week.weekNumber,
    year,
    startDate: new Date().toISOString(),
    activities: [],
    importantNotToMiss: week.importantNotToMiss ?? [],
    gotchas: week.gotchas ?? [],
    parentNotes: '',
    status: 'pending',
    updatedAt: new Date().toISOString(),
  };
  stores.addWeekPlan(newPlan);
  applyWeekActivities(week.activities, undefined, stores, newPlan.id);
  return newPlan.id;
}

export function applyImport(data: PlanImport, childId: string, stores: StoreAccessors): void {
  const now = new Date().toISOString();

  if (data.type === 'weekly') {
    applyWeek(
      { weekNumber: data.weekNumber, activities: data.activities, importantNotToMiss: data.importantNotToMiss, gotchas: data.gotchas },
      data.year,
      childId,
      stores,
    );
    return;
  }

  if (data.type === 'monthly') {
    const weekPlanIds: string[] = [];

    for (const w of data.weeks) {
      const wpId = applyWeek(w, data.year, childId, stores);
      weekPlanIds.push(wpId);
    }

    const existingMonth = stores.getPlanByMonth(childId, data.month, data.year);
    if (existingMonth) {
      const mergedWeekIds = [...new Set([...existingMonth.weekPlanIds, ...weekPlanIds])];
      stores.updateMonthPlan(existingMonth.id, {
        theme: data.theme,
        supportThemes: data.supportThemes ?? existingMonth.supportThemes,
        mustNotMiss: data.mustNotMiss ?? existingMonth.mustNotMiss,
        gotchaRisk: data.gotchaRisk ?? existingMonth.gotchaRisk,
        weekPlanIds: mergedWeekIds,
      });
    } else {
      stores.addMonthPlan({
        id: nanoid(),
        childId,
        year: data.year,
        month: data.month,
        theme: data.theme,
        supportThemes: data.supportThemes ?? [],
        mustNotMiss: data.mustNotMiss ?? '',
        gotchaRisk: data.gotchaRisk ?? '',
        weekPlanIds,
        notes: '',
        status: 'pending',
        createdAt: now,
        updatedAt: now,
      });
    }
    return;
  }

  if (data.type === 'yearly') {
    const monthPlanIds: string[] = [];

    for (const m of data.months) {
      const weekPlanIds: string[] = [];
      for (const w of m.weeks) {
        const wpId = applyWeek(w, data.year, childId, stores);
        weekPlanIds.push(wpId);
      }

      const existingMonth = stores.getPlanByMonth(childId, m.month, data.year);
      if (existingMonth) {
        const mergedWeekIds = [...new Set([...existingMonth.weekPlanIds, ...weekPlanIds])];
        stores.updateMonthPlan(existingMonth.id, {
          theme: m.theme,
          supportThemes: m.supportThemes ?? existingMonth.supportThemes,
          mustNotMiss: m.mustNotMiss ?? existingMonth.mustNotMiss,
          gotchaRisk: m.gotchaRisk ?? existingMonth.gotchaRisk,
          weekPlanIds: mergedWeekIds,
        });
        monthPlanIds.push(existingMonth.id);
      } else {
        const mpId = nanoid();
        stores.addMonthPlan({
          id: mpId,
          childId,
          yearPlanId: undefined,
          year: data.year,
          month: m.month,
          theme: m.theme,
          supportThemes: m.supportThemes ?? [],
          mustNotMiss: m.mustNotMiss ?? '',
          gotchaRisk: m.gotchaRisk ?? '',
          weekPlanIds,
          notes: '',
          status: 'pending',
          createdAt: now,
          updatedAt: now,
        });
        monthPlanIds.push(mpId);
      }
    }

    const existingYear = stores.getPlanByYear(childId, data.year);
    if (existingYear) {
      const mergedMonthIds = [...new Set([...existingYear.monthPlanIds, ...monthPlanIds])];
      stores.updateYearPlan(existingYear.id, {
        goals: data.goals ?? existingYear.goals,
        monthPlanIds: mergedMonthIds,
      });
    } else {
      stores.addYearPlan({
        id: nanoid(),
        childId,
        year: data.year,
        ageBand: data.ageBand,
        goals: data.goals ?? [],
        monthPlanIds,
        notes: '',
        status: 'pending',
        createdAt: now,
        updatedAt: now,
      });
    }
  }
}
