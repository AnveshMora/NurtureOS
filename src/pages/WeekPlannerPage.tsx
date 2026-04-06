import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { nanoid } from 'nanoid';
import { Card, Button, EmptyState, Modal, TextArea } from '../components/ui';
import { useWeekPlanStore, useActivityStore } from '../store';
import { useActiveChild } from '../hooks/useActiveChild';
import { useCurrentWeek } from '../hooks/useCurrentWeek';
import { useAgeBand } from '../hooks/useAgeBand';
import { CATEGORY_ICONS, DURATION_LABELS, SLOT_LABELS } from '../types';
import type { ActivityStatus, TimeSlot, WeekPlan } from '../types';
import { IMPORTANT_NOT_TO_MISS } from '../data/importantNotToMiss';

const STATUS_CYCLE: ActivityStatus[] = ['pending', 'in-progress', 'completed'];

function nextStatus(current: ActivityStatus): ActivityStatus {
  if (current === 'skipped') return 'pending';
  const idx = STATUS_CYCLE.indexOf(current);
  return STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
}

export function WeekPlannerPage() {
  const navigate = useNavigate();
  const { child } = useActiveChild();
  const ageBandInfo = useAgeBand();
  const { weekNumber, year, weekRange, isCurrentWeek, goNext, goPrev, goToCurrentWeek } = useCurrentWeek();
  const { getPlanByWeek, addWeekPlan, setActivityStatus, updateWeekActivity, removeActivityFromWeek, updateWeekPlan } = useWeekPlanStore();
  const getActivity = useActivityStore((s) => s.getActivity);

  const [notesModal, setNotesModal] = useState<{ weekActivityId: string; notes: string } | null>(null);
  const [weekNotesOpen, setWeekNotesOpen] = useState(false);

  if (!child) {
    return <EmptyState icon="👶" title="No child selected" description="Add a child in Settings first." />;
  }

  const weekPlan = getPlanByWeek(child.id, weekNumber, year);

  // Important items for age band
  const importantItems = ageBandInfo
    ? IMPORTANT_NOT_TO_MISS.filter((item) => item.ageBands.includes(ageBandInfo.ageBand))
    : [];

  const handleCreateWeek = () => {
    addWeekPlan({
      id: nanoid(),
      childId: child.id,
      weekNumber,
      year,
      startDate: new Date().toISOString(),
      activities: [],
      importantNotToMiss: importantItems.map((i) => i.id),
      gotchas: [],
      parentNotes: '',
      status: 'pending',
      updatedAt: new Date().toISOString(),
    });
  };

  const handleStatusToggle = (weekActivityId: string, currentStatus: ActivityStatus) => {
    if (!weekPlan) return;
    setActivityStatus(weekPlan.id, weekActivityId, nextStatus(currentStatus));
  };

  const handleSkip = (weekActivityId: string) => {
    if (!weekPlan) return;
    setActivityStatus(weekPlan.id, weekActivityId, 'skipped');
  };

  const handleRemove = (weekActivityId: string) => {
    if (!weekPlan) return;
    removeActivityFromWeek(weekPlan.id, weekActivityId);
  };

  const handleSaveNotes = () => {
    if (!weekPlan || !notesModal) return;
    updateWeekActivity(weekPlan.id, notesModal.weekActivityId, { notes: notesModal.notes });
    setNotesModal(null);
  };

  // Group activities by slot
  const grouped: Record<TimeSlot, WeekPlan['activities']> = {
    morning: [],
    afternoon: [],
    evening: [],
  };
  if (weekPlan) {
    for (const wa of weekPlan.activities) {
      grouped[wa.slot].push(wa);
    }
  }

  // Stats
  const total = weekPlan?.activities.length ?? 0;
  const completed = weekPlan?.activities.filter((a) => a.status === 'completed').length ?? 0;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <button onClick={goPrev} className="p-2 rounded-md hover:bg-surface-100 text-surface-500">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="text-center">
          <div className="text-sm font-semibold text-surface-800">Week {weekNumber}</div>
          <div className="text-xs text-surface-400">{weekRange}</div>
        </div>
        <button onClick={goNext} className="p-2 rounded-md hover:bg-surface-100 text-surface-500">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {!isCurrentWeek && (
        <button
          onClick={goToCurrentWeek}
          className="w-full text-center text-xs text-primary-500 hover:text-primary-600 font-medium py-1"
        >
          ← Back to Current Week
        </button>
      )}

      {/* No plan yet */}
      {!weekPlan ? (
        <EmptyState
          icon="📅"
          title={`No plan for Week ${weekNumber}`}
          description="Create a weekly plan and add activities from the library."
          actionLabel="Create Week Plan"
          onAction={handleCreateWeek}
        />
      ) : (
        <>
          {/* Progress */}
          {total > 0 && (
            <div className="flex items-center gap-3">
              <div className="flex-1 h-1.5 bg-surface-100 rounded-full">
                <div
                  className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-xs text-surface-500 font-medium">{completed}/{total}</span>
            </div>
          )}

          {/* Important Not to Miss */}
          {importantItems.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-xs">⚡</span>
                <span className="text-[10px] font-semibold text-amber-700 uppercase tracking-wide">Don't Miss</span>
              </div>
              <div className="space-y-1">
                {importantItems.slice(0, 3).map((item) => (
                  <div key={item.id} className="text-xs text-amber-700">{item.text}</div>
                ))}
              </div>
            </div>
          )}

          {/* Activities by Slot */}
          {(['morning', 'afternoon', 'evening'] as TimeSlot[]).map((slot) => {
            const activities = grouped[slot];
            if (activities.length === 0) return null;
            return (
              <div key={slot}>
                <div className="text-[10px] font-semibold text-surface-400 uppercase tracking-wide mb-2">
                  {SLOT_LABELS[slot]}
                </div>
                <div className="space-y-2">
                  {activities.map((wa) => {
                    const activity = getActivity(wa.activityId);
                    if (!activity) return null;
                    return (
                      <Card key={wa.id} padding="sm">
                        <div className="flex items-center gap-3">
                          {/* Status toggle */}
                          <button
                            onClick={() => handleStatusToggle(wa.id, wa.status)}
                            className="shrink-0"
                            title="Toggle status"
                          >
                            {wa.status === 'completed' ? (
                              <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            ) : wa.status === 'in-progress' ? (
                              <div className="w-6 h-6 rounded-full border-2 border-amber-400 bg-amber-50 flex items-center justify-center">
                                <div className="w-2 h-2 rounded-full bg-amber-400" />
                              </div>
                            ) : wa.status === 'skipped' ? (
                              <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center">
                                <span className="text-xs text-violet-500">—</span>
                              </div>
                            ) : (
                              <div className="w-6 h-6 rounded-full border-2 border-surface-300" />
                            )}
                          </button>

                          {/* Activity info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm">{CATEGORY_ICONS[activity.category]}</span>
                              <span className={`text-sm font-medium truncate ${wa.status === 'completed' ? 'text-surface-400 line-through' : 'text-surface-800'}`}>
                                {activity.title}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-surface-400">{DURATION_LABELS[activity.duration]}</span>
                              {wa.notes && (
                                <span className="text-[10px] text-primary-500">📝 has notes</span>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => setNotesModal({ weekActivityId: wa.id, notes: wa.notes })}
                              className="p-1.5 rounded text-surface-400 hover:text-surface-600 hover:bg-surface-100"
                              title="Notes"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleSkip(wa.id)}
                              className="p-1.5 rounded text-surface-400 hover:text-violet-500 hover:bg-violet-50"
                              title="Skip"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleRemove(wa.id)}
                              className="p-1.5 rounded text-surface-400 hover:text-red-500 hover:bg-red-50"
                              title="Remove"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Empty activities */}
          {total === 0 && (
            <EmptyState
              icon="📚"
              title="No activities yet"
              description="Add activities from the library."
              actionLabel="Browse Activities"
              onAction={() => navigate('/activities')}
            />
          )}

          {/* Add Activity + Week Notes */}
          <div className="flex gap-2">
            <Link to="/activities" className="flex-1">
              <Button variant="secondary" fullWidth size="sm">
                + Add Activity
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={() => setWeekNotesOpen(true)}>
              📝 Week Notes
            </Button>
          </div>

          {/* Weekend Review Link */}
          <Link to="/review">
            <Card hover>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">✍️</span>
                  <div>
                    <div className="text-sm font-medium text-surface-800">Weekend Review</div>
                    <div className="text-xs text-surface-400">Reflect on this week's progress</div>
                  </div>
                </div>
                <svg className="w-4 h-4 text-surface-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Card>
          </Link>
        </>
      )}

      {/* Activity Notes Modal */}
      <Modal isOpen={!!notesModal} onClose={() => setNotesModal(null)} title="Activity Notes">
        {notesModal && (
          <div className="space-y-3">
            <TextArea
              placeholder="What happened? What did the child respond to?"
              value={notesModal.notes}
              onChange={(e) => setNotesModal({ ...notesModal, notes: e.target.value })}
              rows={4}
            />
            <div className="flex gap-2">
              <Button variant="secondary" fullWidth onClick={() => setNotesModal(null)}>Cancel</Button>
              <Button fullWidth onClick={handleSaveNotes}>Save</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Week Notes Modal */}
      {weekPlan && (
        <Modal isOpen={weekNotesOpen} onClose={() => setWeekNotesOpen(false)} title="Week Notes">
          <div className="space-y-3">
            <TextArea
              placeholder="Patterns this week, attention span trends, motivation trends..."
              value={weekPlan.parentNotes}
              onChange={(e) => updateWeekPlan(weekPlan.id, { parentNotes: e.target.value })}
              rows={5}
            />
            <Button fullWidth onClick={() => setWeekNotesOpen(false)}>Done</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
