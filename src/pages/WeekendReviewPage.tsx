import { useState, useEffect, useMemo } from 'react';
import { nanoid } from 'nanoid';
import { Card, Button, TextArea, EmptyState, Badge } from '../components/ui';
import { useWeekPlanStore, useReviewStore, useActivityStore } from '../store';
import { useActiveChild } from '../hooks/useActiveChild';
import { useCurrentWeek } from '../hooks/useCurrentWeek';
import { SKILL_NODE_LABELS } from '../types';
import type { SkillNode } from '../types';
import { SKILL_NODES, defaultSkillScores } from '../lib/skillMapping';
import { GOTCHA_LIBRARY } from '../data/gotchas';
import { useAgeBand } from '../hooks/useAgeBand';

export function WeekendReviewPage() {
  const { child } = useActiveChild();
  const ageBandInfo = useAgeBand();
  const { weekNumber, year, weekRange } = useCurrentWeek();
  const getPlanByWeek = useWeekPlanStore((s) => s.getPlanByWeek);
  const getActivity = useActivityStore((s) => s.getActivity);
  const { addReview, updateReview, getReviewForWeek } = useReviewStore();

  // Get week plan and existing review
  const weekPlan = child ? getPlanByWeek(child.id, weekNumber, year) : undefined;
  const existingReview = weekPlan ? getReviewForWeek(weekPlan.id) : undefined;

  // Form state
  const [skillScores, setSkillScores] = useState<Record<SkillNode, number>>(defaultSkillScores());
  const [wins, setWins] = useState('');
  const [struggles, setStruggles] = useState('');
  const [gotchasNoticed, setGotchasNoticed] = useState<string[]>([]);
  const [parentNotes, setParentNotes] = useState('');
  const [adjustmentPlan, setAdjustmentPlan] = useState('');
  const [saved, setSaved] = useState(false);

  // Load existing review data
  useEffect(() => {
    if (existingReview) {
      setSkillScores(existingReview.skillScores);
      setWins(existingReview.wins);
      setStruggles(existingReview.struggles);
      setGotchasNoticed(existingReview.gotchasNoticed);
      setParentNotes(existingReview.parentNotes);
      setAdjustmentPlan(existingReview.adjustmentPlan);
    }
  }, [existingReview?.id]);

  // Auto-populate status summary from week plan
  const statusSummary = useMemo(() => {
    if (!weekPlan) return { inProgress: [] as string[], pending: [] as string[], completed: [] as string[] };
    const inProgress: string[] = [];
    const pending: string[] = [];
    const completed: string[] = [];
    for (const wa of weekPlan.activities) {
      const activity = getActivity(wa.activityId);
      const title = activity?.title ?? 'Unknown';
      if (wa.status === 'completed') completed.push(title);
      else if (wa.status === 'in-progress') inProgress.push(title);
      else if (wa.status === 'pending') pending.push(title);
    }
    return { inProgress, pending, completed };
  }, [weekPlan, getActivity]);

  // Gotchas for age band
  const relevantGotchas = ageBandInfo
    ? GOTCHA_LIBRARY.filter((g) => g.ageBands.includes(ageBandInfo.ageBand))
    : GOTCHA_LIBRARY;

  const toggleGotcha = (id: string) => {
    setGotchasNoticed((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  const handleSave = () => {
    if (!child || !weekPlan) return;

    const reviewData = {
      childId: child.id,
      weekPlanId: weekPlan.id,
      date: new Date().toISOString(),
      skillScores,
      inProgress: statusSummary.inProgress,
      pending: statusSummary.pending,
      completed: statusSummary.completed,
      wins,
      struggles,
      gotchasNoticed,
      importantNextWeek: [],
      parentNotes,
      adjustmentPlan,
    };

    if (existingReview) {
      updateReview(existingReview.id, reviewData);
    } else {
      addReview({
        id: nanoid(),
        ...reviewData,
        createdAt: new Date().toISOString(),
      });
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (!child) {
    return <EmptyState icon="👶" title="No child selected" description="Add a child in Settings first." />;
  }

  if (!weekPlan) {
    return (
      <EmptyState
        icon="✍️"
        title="No week plan to review"
        description={`Create a plan for Week ${weekNumber} first, then come back to review.`}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-surface-800">Weekend Review</h1>
        <p className="text-sm text-surface-500">Week {weekNumber} · {weekRange}</p>
        {existingReview && (
          <Badge variant="success">Review saved</Badge>
        )}
      </div>

      {/* Status Summary (auto-populated) */}
      <Card>
        <div className="text-xs text-surface-400 uppercase tracking-wide font-medium mb-3">
          Activity Status Summary
        </div>
        <div className="space-y-3">
          {statusSummary.completed.length > 0 && (
            <div>
              <div className="text-[10px] font-semibold text-emerald-600 uppercase mb-1">✓ Completed ({statusSummary.completed.length})</div>
              <div className="flex flex-wrap gap-1">
                {statusSummary.completed.map((t) => (
                  <Badge key={t} variant="success">{t}</Badge>
                ))}
              </div>
            </div>
          )}
          {statusSummary.inProgress.length > 0 && (
            <div>
              <div className="text-[10px] font-semibold text-amber-600 uppercase mb-1">◐ In Progress ({statusSummary.inProgress.length})</div>
              <div className="flex flex-wrap gap-1">
                {statusSummary.inProgress.map((t) => (
                  <Badge key={t} variant="warning">{t}</Badge>
                ))}
              </div>
            </div>
          )}
          {statusSummary.pending.length > 0 && (
            <div>
              <div className="text-[10px] font-semibold text-surface-500 uppercase mb-1">○ Pending ({statusSummary.pending.length})</div>
              <div className="flex flex-wrap gap-1">
                {statusSummary.pending.map((t) => (
                  <Badge key={t} variant="default">{t}</Badge>
                ))}
              </div>
            </div>
          )}
          {weekPlan.activities.length === 0 && (
            <p className="text-sm text-surface-400 italic">No activities in this week's plan.</p>
          )}
        </div>
      </Card>

      {/* Skill Node Scoring */}
      <Card>
        <div className="text-xs text-surface-400 uppercase tracking-wide font-medium mb-3">
          Skill Scores (1–5)
        </div>
        <div className="space-y-3">
          {SKILL_NODES.map((node) => (
            <div key={node}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-surface-700">{SKILL_NODE_LABELS[node]}</span>
                <span className="text-xs text-surface-400 font-mono">{skillScores[node]}/5</span>
              </div>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((score) => (
                  <button
                    key={score}
                    onClick={() => setSkillScores((prev) => ({ ...prev, [node]: score }))}
                    className={`
                      flex-1 h-7 rounded text-xs font-medium transition-colors
                      ${skillScores[node] >= score
                        ? 'bg-primary-500 text-white'
                        : 'bg-surface-100 text-surface-400 hover:bg-surface-200'
                      }
                    `}
                  >
                    {score}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Wins */}
      <Card>
        <TextArea
          label="🎉 Wins"
          placeholder="What worked well this week? What breakthroughs happened?"
          value={wins}
          onChange={(e) => setWins(e.target.value)}
          rows={3}
        />
      </Card>

      {/* Struggles */}
      <Card>
        <TextArea
          label="💪 Struggles"
          placeholder="What was difficult? What did the child resist?"
          value={struggles}
          onChange={(e) => setStruggles(e.target.value)}
          rows={3}
        />
      </Card>

      {/* Gotchas Noticed */}
      <Card>
        <div className="text-xs text-surface-400 uppercase tracking-wide font-medium mb-3">
          🚩 Gotchas Noticed
        </div>
        <div className="flex flex-wrap gap-2">
          {relevantGotchas.map((gotcha) => (
            <button
              key={gotcha.id}
              onClick={() => toggleGotcha(gotcha.id)}
              className={`
                px-2.5 py-1 rounded-full text-xs font-medium transition-colors
                ${gotchasNoticed.includes(gotcha.id)
                  ? 'bg-red-100 text-red-700 border border-red-200'
                  : 'bg-surface-100 text-surface-500 hover:bg-surface-200'
                }
              `}
            >
              {gotcha.text}
            </button>
          ))}
        </div>
      </Card>

      {/* Parent Notes */}
      <Card>
        <TextArea
          label="📝 Parent Notes"
          placeholder="Patterns observed, attention span trends, motivation changes..."
          value={parentNotes}
          onChange={(e) => setParentNotes(e.target.value)}
          rows={3}
        />
      </Card>

      {/* Adjustment Plan */}
      <Card>
        <TextArea
          label="🔄 Adjustment Plan"
          placeholder="What should change next week? More of what? Less of what?"
          value={adjustmentPlan}
          onChange={(e) => setAdjustmentPlan(e.target.value)}
          rows={3}
        />
      </Card>

      {/* Save */}
      <div className="sticky bottom-16 pt-2 pb-2 bg-surface-50">
        {saved && (
          <div className="text-center text-sm text-emerald-600 font-medium mb-2">
            ✓ Review saved successfully!
          </div>
        )}
        <Button fullWidth size="lg" onClick={handleSave}>
          {existingReview ? 'Update Review' : 'Save Review'}
        </Button>
      </div>
    </div>
  );
}
