/**
 * Adapts external multi-file datasets (activity_library, weeks, months, year)
 * into our PlanImport format for the existing preview → apply pipeline.
 *
 * Handles field renaming, category/skill key normalization, and
 * resolution of string references between files.
 */

import type { ActivityCategory, ActivityDuration } from '../types/activity';
import type { AgeBand } from '../types/child';
import type { SkillNode } from '../types/skillNode';
import type { MonthNumber } from '../types/monthPlan';
import type { YearlyImport, MonthlyImport, WeeklyImport } from './importPlan';

// ======== Raw dataset shapes (what the external files look like) ========

interface RawActivity {
  id: string;
  title: string;
  category: string;
  difficulty?: string;
  prerequisites?: string[];
  duration_min?: number;
  skillMapping?: Record<string, number>;
  objective?: string;
  materials?: string[];
  instructions?: string[];
  parentPrompts?: string[];
  expectedBehavior?: string;
  commonMistakes?: string[];
  ageBands?: string[];
  status?: string;
  notes?: string;
}

interface RawWeek {
  week: string;
  weekNumber?: number;
  activities: string[];
  importantNotToMiss?: string[];
  gotchas?: string[];
  weekendReview?: unknown;
}

interface RawMonth {
  month: string;
  monthNumber?: number;
  themes?: string[];
  theme?: string;
  weeks: string[];
  importantNotToMiss?: string[];
  gotchas?: string[];
  mustNotMiss?: string;
  gotchaRisk?: string;
  status?: string;
  notes?: string;
}

interface RawYear {
  year?: number;
  ageBand?: string;
  yearGoal?: string[];
  goals?: string[];
  months: string[];
  status?: string;
  notes?: string;
}

export interface DatasetFiles {
  activityLibrary?: { activities: RawActivity[] };
  weeks?: { weeks: RawWeek[] };
  months?: { months: RawMonth[] };
  year?: RawYear;
}

export interface DatasetResult {
  valid: boolean;
  data?: YearlyImport | MonthlyImport | WeeklyImport;
  errors: string[];
  warnings: string[];
}

// ======== Mapping helpers ========

const CATEGORY_MAP: Record<string, ActivityCategory> = {
  practical_life: 'practical-life',
  'practical-life': 'practical-life',
  sensorial: 'sensorial',
  language: 'language',
  math: 'math',
  mathematics: 'math',
  cultural_studies: 'nature-science',
  'cultural-studies': 'nature-science',
  'nature-science': 'nature-science',
  nature_science: 'nature-science',
  science: 'nature-science',
  creative_expression: 'arts-movement',
  'creative-expression': 'arts-movement',
  'arts-movement': 'arts-movement',
  arts: 'arts-movement',
  art: 'arts-movement',
  motor_skills: 'arts-movement',
  'motor-skills': 'arts-movement',
  social_grace: 'social-grace',
  'social-grace': 'social-grace',
  problem_solving: 'sensorial',
};

const SKILL_MAP: Record<string, SkillNode> = {
  curiosity: 'curiosity',
  first_principles: 'firstPrinciples',
  firstPrinciples: 'firstPrinciples',
  problem_solving: 'problemSolving',
  problemSolving: 'problemSolving',
  communication: 'communication',
  grit: 'grit',
  arts: 'arts',
};

function mapCategory(raw: string): ActivityCategory {
  return CATEGORY_MAP[raw] ?? 'practical-life';
}

function mapDuration(mins?: number): ActivityDuration {
  if (!mins || mins <= 15) return '10min';
  if (mins <= 30) return '20min';
  return '45min';
}

function mapSkills(raw?: Record<string, number>): Partial<Record<SkillNode, number>> {
  if (!raw) return {};
  const mapped: Partial<Record<SkillNode, number>> = {};
  for (const [k, v] of Object.entries(raw)) {
    const key = SKILL_MAP[k];
    if (key) mapped[key] = v;
  }
  return mapped;
}

function mapAgeBand(raw?: string): AgeBand {
  if (!raw) return '2-3';
  const valid: AgeBand[] = ['2-3', '3-4', '4-5', '5-6'];
  if (valid.includes(raw as AgeBand)) return raw as AgeBand;
  // Handle "2-6" or other ranges — default to youngest
  return '2-3';
}

function parseNumber(s: string, prefix: string): number {
  // "Week 1" → 1, "Month 3" → 3
  const match = s.replace(prefix, '').trim();
  const n = parseInt(match, 10);
  return isNaN(n) ? 1 : n;
}

// ======== Core adapter ========

export function adaptDataset(
  files: DatasetFiles,
  year?: number,
): DatasetResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const currentYear = year ?? new Date().getFullYear();

  const activities = files.activityLibrary?.activities ?? [];
  const rawWeeks = files.weeks?.weeks ?? [];
  const rawMonths = files.months?.months ?? [];
  const rawYear = files.year;

  if (activities.length === 0) {
    errors.push('No activities found in activity_library.json');
  }
  if (rawWeeks.length === 0) {
    errors.push('No weeks found in weeks.json');
  }

  if (errors.length > 0) {
    return { valid: false, errors, warnings };
  }

  // Build activity lookup
  const actMap = new Map<string, RawActivity>();
  for (const act of activities) {
    actMap.set(act.id, act);
  }

  // Convert raw activities to inline import activities
  function toInlineActivity(actId: string) {
    const raw = actMap.get(actId);
    if (!raw) {
      warnings.push(`Activity "${actId}" not found in library — skipping`);
      return null;
    }
    return {
      inline: true as const,
      title: raw.title,
      category: mapCategory(raw.category),
      duration: mapDuration(raw.duration_min),
      materials: raw.materials ?? [],
      instructions: raw.instructions ?? [],
      parentPrompts: raw.parentPrompts ?? [],
      expectedBehavior: raw.expectedBehavior ?? raw.objective ?? '',
      commonMistakes: raw.commonMistakes ?? [],
      skillMapping: mapSkills(raw.skillMapping),
      ageBands: raw.ageBands?.map(mapAgeBand) ?? (['2-3', '3-4', '4-5', '5-6'] as AgeBand[]),
    };
  }

  // Build week lookup by name
  const weekMap = new Map<string, RawWeek>();
  for (const w of rawWeeks) {
    const key = w.week ?? `Week ${w.weekNumber}`;
    weekMap.set(key, w);
  }

  // Build month lookup by name
  const monthMap = new Map<string, RawMonth>();
  for (const m of rawMonths) {
    const key = m.month ?? `Month ${m.monthNumber}`;
    monthMap.set(key, m);
  }

  // Convert a raw week → import week template
  function convertWeek(raw: RawWeek, fallbackNumber: number) {
    const weekNum = raw.weekNumber ?? parseNumber(raw.week, 'Week');
    const importActivities = raw.activities
      .map(toInlineActivity)
      .filter((a): a is NonNullable<typeof a> => a !== null);

    return {
      weekNumber: weekNum || fallbackNumber,
      activities: importActivities,
      importantNotToMiss: raw.importantNotToMiss ?? [],
      gotchas: raw.gotchas ?? [],
    };
  }

  // ---- If we have year + months → produce YearlyImport ----
  if (rawYear && rawMonths.length > 0) {
    const monthImports: YearlyImport['months'] = [];

    // Resolve months referenced in year (or use all months if references are just names)
    const monthRefs = rawYear.months ?? [];
    const resolvedMonths = monthRefs.length > 0
      ? monthRefs.map((ref) => monthMap.get(ref)).filter((m): m is RawMonth => m !== undefined)
      : rawMonths;

    if (resolvedMonths.length === 0) {
      warnings.push('Year references months that were not found — using all months from months.json');
      resolvedMonths.push(...rawMonths);
    }

    let globalWeekCounter = 1;

    for (let mi = 0; mi < resolvedMonths.length; mi++) {
      const rm = resolvedMonths[mi];
      const monthNum = (rm.monthNumber ?? parseNumber(rm.month, 'Month')) as MonthNumber;

      // Resolve weeks referenced in this month
      const weekRefs = rm.weeks ?? [];
      const resolvedWeeks = weekRefs.length > 0
        ? weekRefs.map((ref) => weekMap.get(ref)).filter((w): w is RawWeek => w !== undefined)
        : [];

      if (resolvedWeeks.length === 0 && weekRefs.length > 0) {
        warnings.push(`Month "${rm.month}" references weeks not found in weeks.json — creating from all weeks`);
        // Fallback: assign all weeks to the first month
        if (mi === 0) resolvedWeeks.push(...rawWeeks);
      }

      const weekTemplates = resolvedWeeks.map((w) => {
        const converted = convertWeek(w, globalWeekCounter);
        // Propagate month-level gotchas/importantNotToMiss to weeks if they don't have their own
        if (converted.importantNotToMiss.length === 0 && rm.importantNotToMiss) {
          converted.importantNotToMiss = rm.importantNotToMiss;
        }
        if (converted.gotchas.length === 0 && rm.gotchas) {
          converted.gotchas = rm.gotchas;
        }
        globalWeekCounter++;
        return converted;
      });

      const themes = rm.themes ?? (rm.theme ? [rm.theme] : []);
      monthImports.push({
        month: (monthNum >= 1 && monthNum <= 12 ? monthNum : mi + 1) as MonthNumber,
        theme: themes[0] ?? `Month ${mi + 1}`,
        supportThemes: themes.slice(1),
        mustNotMiss: rm.mustNotMiss ?? rm.importantNotToMiss?.join(', ') ?? '',
        gotchaRisk: rm.gotchaRisk ?? rm.gotchas?.join(', ') ?? '',
        weeks: weekTemplates,
      });
    }

    const result: YearlyImport = {
      type: 'yearly',
      year: rawYear.year ?? currentYear,
      ageBand: mapAgeBand(rawYear.ageBand),
      goals: rawYear.yearGoal ?? rawYear.goals ?? [],
      months: monthImports,
    };

    return { valid: true, data: result, errors: [], warnings };
  }

  // ---- If we have months but no year → produce MonthlyImport (first month) ----
  if (rawMonths.length > 0) {
    const rm = rawMonths[0];
    const monthNum = (rm.monthNumber ?? parseNumber(rm.month, 'Month')) as MonthNumber;

    const weekRefs = rm.weeks ?? [];
    const resolvedWeeks = weekRefs.length > 0
      ? weekRefs.map((ref) => weekMap.get(ref)).filter((w): w is RawWeek => w !== undefined)
      : rawWeeks;

    const weekTemplates = resolvedWeeks.map((w, i) => convertWeek(w, i + 1));
    const themes = rm.themes ?? (rm.theme ? [rm.theme] : []);

    const result: MonthlyImport = {
      type: 'monthly',
      month: (monthNum >= 1 && monthNum <= 12 ? monthNum : 1) as MonthNumber,
      year: currentYear,
      theme: themes[0] ?? 'Imported Month',
      supportThemes: themes.slice(1),
      mustNotMiss: rm.mustNotMiss ?? rm.importantNotToMiss?.join(', ') ?? '',
      gotchaRisk: rm.gotchaRisk ?? rm.gotchas?.join(', ') ?? '',
      weeks: weekTemplates,
    };

    return { valid: true, data: result, errors: [], warnings };
  }

  // ---- Only weeks → produce WeeklyImport (first week) ----
  if (rawWeeks.length > 0) {
    const rw = rawWeeks[0];
    const converted = convertWeek(rw, 1);

    const result: WeeklyImport = {
      type: 'weekly',
      weekNumber: converted.weekNumber,
      year: currentYear,
      activities: converted.activities,
      importantNotToMiss: converted.importantNotToMiss,
      gotchas: converted.gotchas,
    };

    return { valid: true, data: result, errors: [], warnings };
  }

  errors.push('Could not determine import scope — no weeks or months found');
  return { valid: false, errors, warnings };
}

// ======== File detection ========

type DatasetFileType = 'activityLibrary' | 'weeks' | 'months' | 'year' | 'unknown';

export function detectFileType(filename: string, content: unknown): DatasetFileType {
  const lower = filename.toLowerCase();

  if (lower.includes('activity') || lower.includes('library')) return 'activityLibrary';
  if (lower.includes('week')) return 'weeks';
  if (lower.includes('month')) return 'months';
  if (lower.includes('year')) return 'year';

  // Detect by shape
  if (content && typeof content === 'object') {
    const obj = content as Record<string, unknown>;
    if (Array.isArray(obj.activities)) return 'activityLibrary';
    if (Array.isArray(obj.weeks)) return 'weeks';
    if (Array.isArray(obj.months)) {
      // Could be months.json or year.json — year.json has ageBand/yearGoal
      if ('ageBand' in obj || 'yearGoal' in obj) return 'year';
      return 'months';
    }
    if ('ageBand' in obj || 'yearGoal' in obj) return 'year';
  }

  return 'unknown';
}

export function parseDatasetFiles(
  fileEntries: { name: string; content: string }[],
): { files: DatasetFiles; errors: string[] } {
  const errors: string[] = [];
  const files: DatasetFiles = {};

  for (const entry of fileEntries) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(entry.content);
    } catch {
      errors.push(`Failed to parse "${entry.name}" — invalid JSON`);
      continue;
    }

    const type = detectFileType(entry.name, parsed);

    switch (type) {
      case 'activityLibrary':
        files.activityLibrary = parsed as DatasetFiles['activityLibrary'];
        break;
      case 'weeks':
        files.weeks = parsed as DatasetFiles['weeks'];
        break;
      case 'months':
        files.months = parsed as DatasetFiles['months'];
        break;
      case 'year':
        files.year = parsed as DatasetFiles['year'];
        break;
      default:
        errors.push(`Could not detect type of "${entry.name}" — skipped`);
    }
  }

  return { files, errors };
}
