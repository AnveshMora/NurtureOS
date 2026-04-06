import { Link } from 'react-router-dom';
import { Card, Badge, EmptyState, Button } from '../components/ui';
import { useActiveChild } from '../hooks/useActiveChild';
import { useCurrentWeek } from '../hooks/useCurrentWeek';
import { useAgeBand } from '../hooks/useAgeBand';
import { useWeekPlanStore, useReviewStore } from '../store';
import { SKILL_NODE_LABELS } from '../types';
import type { SkillNode } from '../types';
import { IMPORTANT_NOT_TO_MISS } from '../data/importantNotToMiss';
import { GOTCHA_LIBRARY } from '../data/gotchas';

export function DashboardPage() {
  const { child } = useActiveChild();
  const ageBandInfo = useAgeBand();
  const { weekNumber, year, weekRange } = useCurrentWeek();
  const getPlanByWeek = useWeekPlanStore((s) => s.getPlanByWeek);
  const getReviewsForChild = useReviewStore((s) => s.getReviewsForChild);

  if (!child || !ageBandInfo) {
    return <EmptyState icon="🌱" title="No child selected" description="Add a child in Settings to get started." />;
  }

  const weekPlan = getPlanByWeek(child.id, weekNumber, year);
  const reviews = getReviewsForChild(child.id);

  // Week stats
  const totalActivities = weekPlan?.activities.length ?? 0;
  const completedActivities = weekPlan?.activities.filter((a) => a.status === 'completed').length ?? 0;
  const inProgressActivities = weekPlan?.activities.filter((a) => a.status === 'in-progress').length ?? 0;
  const pendingActivities = weekPlan?.activities.filter((a) => a.status === 'pending').length ?? 0;
  const completionPct = totalActivities > 0 ? Math.round((completedActivities / totalActivities) * 100) : 0;

  // Important not to miss for this age band
  const importantItems = IMPORTANT_NOT_TO_MISS.filter((item) =>
    item.ageBands.includes(ageBandInfo.ageBand)
  );

  // Gotchas for this age band
  const relevantGotchas = GOTCHA_LIBRARY.filter((g) =>
    g.ageBands.includes(ageBandInfo.ageBand)
  ).slice(0, 3);

  // Latest skill scores from most recent review
  const latestReview = reviews.length > 0 ? reviews[reviews.length - 1] : null;

  return (
    <div className="space-y-4">
      {/* Greeting + Age Band */}
      <div>
        <h1 className="text-xl font-bold text-surface-800">
          {child.name}'s Dashboard
        </h1>
        <p className="text-sm text-surface-500">
          {ageBandInfo.label} · {ageBandInfo.formattedAge} · Focus: {ageBandInfo.focus[0]}
        </p>
      </div>

      {/* Week At-a-Glance */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-xs text-surface-400 uppercase tracking-wide font-medium">Week {weekNumber}</div>
            <div className="text-sm text-surface-600">{weekRange}</div>
          </div>
          <Link to="/week">
            <Badge variant="primary">View Week →</Badge>
          </Link>
        </div>

        {totalActivities > 0 ? (
          <>
            {/* Progress bar */}
            <div className="w-full h-2 bg-surface-100 rounded-full mb-3">
              <div
                className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${completionPct}%` }}
              />
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-lg font-bold text-emerald-600">{completedActivities}</div>
                <div className="text-[10px] text-surface-400 uppercase">Done</div>
              </div>
              <div>
                <div className="text-lg font-bold text-amber-500">{inProgressActivities}</div>
                <div className="text-[10px] text-surface-400 uppercase">In Progress</div>
              </div>
              <div>
                <div className="text-lg font-bold text-surface-400">{pendingActivities}</div>
                <div className="text-[10px] text-surface-400 uppercase">Pending</div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-surface-400 mb-2">No activities planned this week</p>
            <Link to="/week">
              <Button variant="secondary" size="sm">Plan This Week</Button>
            </Link>
          </div>
        )}
      </Card>

      {/* Skill Snapshot */}
      {latestReview && (
        <Card>
          <div className="text-xs text-surface-400 uppercase tracking-wide font-medium mb-3">
            Skill Snapshot
          </div>
          <div className="grid grid-cols-2 gap-2">
            {(Object.entries(latestReview.skillScores) as [SkillNode, number][]).map(([skill, score]) => (
              <div key={skill} className="flex items-center gap-2">
                <div className="flex-1 text-xs text-surface-600">{SKILL_NODE_LABELS[skill]}</div>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full ${i <= score ? 'bg-primary-400' : 'bg-surface-200'}`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Important Not to Miss */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm">⚡</span>
          <span className="text-xs text-surface-400 uppercase tracking-wide font-medium">
            Important Not to Miss
          </span>
        </div>
        <div className="space-y-2">
          {importantItems.slice(0, 4).map((item) => (
            <div key={item.id} className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary-400 mt-1.5 shrink-0" />
              <div>
                <div className="text-sm text-surface-700">{item.text}</div>
                <div className="text-xs text-surface-400">{item.frequency}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Gotcha Warnings */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm">🚩</span>
          <span className="text-xs text-surface-400 uppercase tracking-wide font-medium">
            Watch Out For
          </span>
        </div>
        <div className="space-y-2">
          {relevantGotchas.map((gotcha) => (
            <div key={gotcha.id} className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
              <div>
                <div className="text-sm text-surface-700">{gotcha.text}</div>
                <div className="text-xs text-surface-400">{gotcha.description}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-2">
        <Link to="/week">
          <Card hover>
            <div className="text-center py-2">
              <div className="text-lg mb-1">📅</div>
              <div className="text-xs font-medium text-surface-600">Weekly Planner</div>
            </div>
          </Card>
        </Link>
        <Link to="/activities">
          <Card hover>
            <div className="text-center py-2">
              <div className="text-lg mb-1">📚</div>
              <div className="text-xs font-medium text-surface-600">Activity Library</div>
            </div>
          </Card>
        </Link>
        <Link to="/review">
          <Card hover>
            <div className="text-center py-2">
              <div className="text-lg mb-1">✍️</div>
              <div className="text-xs font-medium text-surface-600">Weekend Review</div>
            </div>
          </Card>
        </Link>
        <Link to="/settings">
          <Card hover>
            <div className="text-center py-2">
              <div className="text-lg mb-1">⚙️</div>
              <div className="text-xs font-medium text-surface-600">Settings</div>
            </div>
          </Card>
        </Link>
      </div>
    </div>
  );
}
