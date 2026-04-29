# Domain Model — NurtureOS

> Auto-generated from `src/types/`. Domain is a planning hierarchy for parent-led Montessori-style activities for children ages 2–6.

## Entity hierarchy

```
ChildProfile
  └─ YearPlan (per year)        ──┐
      └─ MonthPlan (12 per year)  ──┐  reference each other by ID,
          └─ WeekPlan (~52)        ──┘  flat-stored in their own Zustand stores
              ├─ WeekActivity[]
              └─ WeekendReview (1 per week, separate store)

Activity (catalog) — referenced by WeekActivity.activityId
SkillNode — taxonomy used by Activity.skillMapping and WeekendReview.skillScores
```

All entities live as flat arrays in their respective Zustand stores (`src/store/*.ts`), each persisted to localStorage under `nurtureos-{entity}`. Cross-entity links are by string `id`, not by reference.

## Entities

### ChildProfile (`src/types/child.ts`)
| Field | Type | Notes |
|-------|------|-------|
| `id` | string | nanoid (assumed — see `data/activities.ts` and stores) |
| `name` | string | |
| `dateOfBirth` | string | ISO date |
| `ageBand` | `'2-3' \| '3-4' \| '4-5' \| '5-6'` | Drives age-appropriate filtering |
| `preferences` | string[] | Free-form |
| `sensitivities` | string[] | Free-form |
| `languageEnvironment` | string | |
| `createdAt`, `updatedAt` | string | ISO timestamp; `updatedAt` is the **merge tiebreaker** |

Constants exported: `AGE_BAND_LABELS`, `AGE_BAND_FOCUS` (per-band focus areas).

### Activity (`src/types/activity.ts`)
| Field | Type | Notes |
|-------|------|-------|
| `id` | string | |
| `title` | string | |
| `category` | `ActivityCategory` | 7 values: `practical-life`, `sensorial`, `language`, `math`, `nature-science`, `arts-movement`, `social-grace` |
| `skillMapping` | `Record<SkillNode, number>` | All 6 skill nodes scored |
| `ageBands` | `AgeBand[]` | Which bands this activity fits |
| `duration` | `'10min' \| '20min' \| '45min'` | |
| `materials`, `instructions`, `parentPrompts`, `commonMistakes` | string[] | |
| `expectedBehavior` | string | |
| `isCustom` | boolean | False for seeded library activities |
| `createdAt` | string | **No `updatedAt`** — see equality traps |

Catalog is seeded from `src/data/activities.ts` (`SEED_ACTIVITIES`). The activity store reseeds on `resetToDefaults()`.

### WeekPlan + WeekActivity (`src/types/weekPlan.ts`)
| Field (WeekPlan) | Type | Notes |
|------------------|------|-------|
| `id`, `childId` | string | |
| `weekNumber`, `year` | number | Composite natural key for `getPlanByWeek` |
| `startDate` | string | ISO date |
| `activities` | `WeekActivity[]` | Embedded — not their own store |
| `importantNotToMiss`, `gotchas` | string[] | |
| `parentNotes` | string | |
| `status` | `'pending' \| 'in-progress' \| 'completed'` | `PlanStatus` |
| `updatedAt` | string | |

| Field (WeekActivity) | Type | Notes |
|----------------------|------|-------|
| `id` | string | Distinct from `activityId` |
| `activityId` | string | FK to `Activity` |
| `day` | `DayOfWeek?` | Optional — unscheduled activities have no day |
| `slot` | `'morning' \| 'afternoon' \| 'evening'` | |
| `status` | `ActivityStatus` (`pending` \| `in-progress` \| `completed` \| `skipped`) | Note `skipped` exists on activity but not on plan |
| `notes` | string | |
| `updatedAt` | string | |

Day/slot constants: `DAY_LABELS`, `SLOT_LABELS`.

### MonthPlan (`src/types/monthPlan.ts`)
- `id`, `childId`, `yearPlanId?`
- `year: number`, `month: MonthNumber` (1–12 literal union)
- `theme`, `supportThemes[]`
- `mustNotMiss`, `gotchaRisk` (free-form strings, distinct from week-level `string[]`)
- `weekPlanIds: string[]` — references to WeekPlan IDs
- `notes`, `status`, `createdAt`, `updatedAt`

### YearPlan (`src/types/yearPlan.ts`)
- `id`, `childId`
- `year`, `ageBand`
- `goals[]`, `monthPlanIds[]`
- `notes`, `status`, `createdAt`, `updatedAt`

### WeekendReview (`src/types/review.ts`)
- `id`, `childId`, `weekPlanId`
- `date`
- `skillScores: Record<SkillNode, number>` — 1–5 rubric (see `SKILL_RUBRIC` in `skillNode.ts`, currently 3 levels per node)
- Bucketed activity titles: `inProgress[]`, `pending[]`, `completed[]`
- `wins`, `struggles`, `parentNotes`, `adjustmentPlan` (free-form strings)
- `gotchasNoticed[]`, `importantNextWeek[]`
- `createdAt` — **no `updatedAt`** — see equality traps

### SkillNode (`src/types/skillNode.ts`)
Enum-style string union, six values:
```
curiosity | firstPrinciples | problemSolving | communication | grit | arts
```
Constants: `SKILL_NODE_LABELS`, `SKILL_NODE_COLORS` (CSS variables), `SKILL_RUBRIC` (3 strings per node — currently asymmetric with the 1–5 numeric scale used in `WeekendReview`).

## Equality / merge traps

The sync layer (`backend/src/routes/sync.ts`) merges arrays by `id` with timestamp tiebreak: `updatedAt ?? createdAt ?? ''`. Entities **without** `updatedAt` will compare on `createdAt` only and never lose to an updated remote. Catalogue:

| Entity | Has `updatedAt`? | Risk |
|--------|------------------|------|
| `ChildProfile` | ✅ | None |
| `WeekPlan` | ✅ | None |
| `WeekActivity` | ✅ | None — but it's embedded inside `WeekPlan.activities`; merge is **per-WeekPlan**, not per-WeekActivity. Concurrent edits to different activities in the same week race on the WeekPlan timestamp. |
| `MonthPlan` | ✅ | None |
| `YearPlan` | ✅ | None |
| `Activity` | ❌ (only `createdAt`) | Edits to a custom activity won't beat older remote edits. Either add `updatedAt` or accept "last writer to recreate" semantics. |
| `WeekendReview` | ❌ (only `createdAt`) | Same trap — late corrections may lose. |

## Embedded vs referenced

| Relation | Style |
|----------|-------|
| `WeekPlan.activities` | **Embedded** (`WeekActivity[]` inline) |
| `MonthPlan.weekPlanIds` | **Referenced** (string[] FK) |
| `YearPlan.monthPlanIds` | **Referenced** (string[] FK) |
| `WeekendReview.weekPlanId` | **Referenced** (single FK) |
| `WeekActivity.activityId` | **Referenced** (FK to Activity catalog) |

This means a WeekPlan can be merged in isolation, but a Month/Year edit that adjusts its plan list races with the underlying plans being added/removed. There is no referential integrity check on merge.

## ID conventions

IDs are arbitrary strings — `nanoid` is in `package.json` and used in import flows (`src/lib/importPlan.ts`). Some imported IDs may be human-readable (`"activity-..."`); the merge layer treats any non-empty `id` as authoritative.

## Status enums

Two distinct enums share the strings `pending | in-progress | completed`:
- `PlanStatus` — for plans (no `skipped`)
- `ActivityStatus` — for activities (adds `skipped`)

If you ever widen plan statuses, mirror across both and update consumers (`StatusPill`, `WeekPlannerPage`, `WeekendReviewPage`).
