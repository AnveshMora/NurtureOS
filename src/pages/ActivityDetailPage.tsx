import { useParams, useNavigate } from 'react-router-dom';
import { nanoid } from 'nanoid';
import { Card, Badge, Button, EmptyState } from '../components/ui';
import { useActivityStore, useWeekPlanStore } from '../store';
import { useActiveChild } from '../hooks/useActiveChild';
import { useCurrentWeek } from '../hooks/useCurrentWeek';
import {
  CATEGORY_LABELS, CATEGORY_ICONS, DURATION_LABELS,
  SKILL_NODE_LABELS, AGE_BAND_LABELS,
} from '../types';
import type { SkillNode } from '../types';
import { SKILL_NODES } from '../lib/skillMapping';

const skillBarColors: Record<SkillNode, string> = {
  curiosity: 'bg-blue-400',
  firstPrinciples: 'bg-violet-400',
  problemSolving: 'bg-cyan-400',
  communication: 'bg-emerald-400',
  grit: 'bg-amber-400',
  arts: 'bg-pink-400',
};

export function ActivityDetailPage() {
  const { activityId } = useParams<{ activityId: string }>();
  const navigate = useNavigate();
  const getActivity = useActivityStore((s) => s.getActivity);
  const { child } = useActiveChild();
  const { weekNumber, year } = useCurrentWeek();
  const { getPlanByWeek, addWeekPlan, addActivityToWeek } = useWeekPlanStore();

  const activity = activityId ? getActivity(activityId) : undefined;

  if (!activity) {
    return <EmptyState icon="❓" title="Activity not found" actionLabel="Back to Library" onAction={() => navigate('/activities')} />;
  }

  const handleAddToWeek = () => {
    if (!child) return;

    let weekPlan = getPlanByWeek(child.id, weekNumber, year);
    if (!weekPlan) {
      const newPlan = {
        id: nanoid(),
        childId: child.id,
        weekNumber,
        year,
        startDate: new Date().toISOString(),
        activities: [],
        importantNotToMiss: [],
        gotchas: [],
        parentNotes: '',
        status: 'pending' as const,
        updatedAt: new Date().toISOString(),
      };
      addWeekPlan(newPlan);
      weekPlan = newPlan;
    }

    const alreadyAdded = weekPlan.activities.some((a) => a.activityId === activity.id);
    if (alreadyAdded) {
      navigate('/week');
      return;
    }

    addActivityToWeek(weekPlan.id, {
      id: nanoid(),
      activityId: activity.id,
      slot: 'morning',
      status: 'pending',
      notes: '',
      updatedAt: new Date().toISOString(),
    });

    navigate('/week');
  };

  return (
    <div className="space-y-4">
      {/* Back button */}
      <button
        onClick={() => navigate('/activities')}
        className="flex items-center gap-1 text-sm text-surface-500 hover:text-surface-700"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      {/* Title + Meta */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl">{CATEGORY_ICONS[activity.category]}</span>
          <h1 className="text-xl font-bold text-surface-800">{activity.title}</h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge>{CATEGORY_LABELS[activity.category]}</Badge>
          <Badge variant="primary">{DURATION_LABELS[activity.duration]}</Badge>
          {activity.ageBands.map((ab) => (
            <Badge key={ab} variant="default">{AGE_BAND_LABELS[ab]}</Badge>
          ))}
          {activity.isCustom && <Badge variant="purple">Custom</Badge>}
        </div>
      </div>

      {/* Skill Mapping */}
      <Card>
        <div className="text-xs text-surface-400 uppercase tracking-wide font-medium mb-3">
          Skill Mapping
        </div>
        <div className="space-y-2">
          {SKILL_NODES.map((node) => (
            <div key={node} className="flex items-center gap-3">
              <div className="w-24 text-xs text-surface-600">{SKILL_NODE_LABELS[node]}</div>
              <div className="flex-1 h-2 bg-surface-100 rounded-full">
                <div
                  className={`h-full rounded-full ${skillBarColors[node]} transition-all`}
                  style={{ width: `${(activity.skillMapping[node] / 5) * 100}%` }}
                />
              </div>
              <div className="text-xs text-surface-400 w-4 text-right">{activity.skillMapping[node]}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Materials */}
      <Card>
        <div className="text-xs text-surface-400 uppercase tracking-wide font-medium mb-2">
          Materials
        </div>
        <ul className="space-y-1">
          {activity.materials.map((m, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-surface-700">
              <span className="text-surface-300 mt-0.5">•</span>
              {m}
            </li>
          ))}
        </ul>
      </Card>

      {/* Instructions */}
      <Card>
        <div className="text-xs text-surface-400 uppercase tracking-wide font-medium mb-2">
          Instructions
        </div>
        <ol className="space-y-2">
          {activity.instructions.map((step, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-surface-700">
              <span className="text-xs font-mono text-surface-400 mt-0.5 w-4 shrink-0">{i + 1}.</span>
              {step}
            </li>
          ))}
        </ol>
      </Card>

      {/* Parent Prompts */}
      <Card>
        <div className="text-xs text-surface-400 uppercase tracking-wide font-medium mb-2">
          Parent Prompts
        </div>
        <div className="space-y-1.5">
          {activity.parentPrompts.map((prompt, i) => (
            <div key={i} className="bg-primary-50 rounded px-3 py-1.5 text-sm text-primary-700 italic">
              "{prompt}"
            </div>
          ))}
        </div>
      </Card>

      {/* Expected Behavior */}
      <Card>
        <div className="text-xs text-surface-400 uppercase tracking-wide font-medium mb-2">
          What to Expect
        </div>
        <p className="text-sm text-surface-700">{activity.expectedBehavior}</p>
      </Card>

      {/* Common Mistakes */}
      {activity.commonMistakes.length > 0 && (
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm">🚩</span>
            <span className="text-xs text-surface-400 uppercase tracking-wide font-medium">
              Common Mistakes
            </span>
          </div>
          <ul className="space-y-1">
            {activity.commonMistakes.map((mistake, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-red-600">
                <span className="text-red-300 mt-0.5">×</span>
                {mistake}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Add to Week CTA */}
      {child && (
        <div className="sticky bottom-16 pt-2 pb-2 bg-surface-50">
          <Button fullWidth size="lg" onClick={handleAddToWeek}>
            + Add to Week {weekNumber}
          </Button>
        </div>
      )}
    </div>
  );
}
