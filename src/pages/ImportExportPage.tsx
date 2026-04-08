import { useState, useRef, useCallback } from 'react';
import { Card, Button, Badge, EmptyState, Modal } from '../components/ui';
import { useActiveChild } from '../hooks/useActiveChild';
import { useActivityStore, useWeekPlanStore, useMonthPlanStore, useYearPlanStore } from '../store';
import { MONTH_LABELS } from '../types';
import type { MonthNumber } from '../types';
import {
  validateImport, generatePreview, applyImport,
  type PlanImport, type ImportPreview, type StoreAccessors, type PreviewAction,
} from '../lib/importPlan';
import { exportWeekPlan, exportMonthPlan, exportYearPlan, downloadJSON } from '../lib/exportPlan';

const ACTION_STYLES: Record<PreviewAction, { bg: string; text: string; label: string }> = {
  create: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: '✨ New' },
  merge: { bg: 'bg-amber-50', text: 'text-amber-700', label: '🔄 Merge' },
  skip: { bg: 'bg-surface-100', text: 'text-surface-500', label: '⏭️ Skip' },
};

export function ImportExportPage() {
  const { child } = useActiveChild();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Import state

  const [importData, setImportData] = useState<PlanImport | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [importSuccess, setImportSuccess] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Store accessors
  const activityStore = useActivityStore();
  const weekPlanStore = useWeekPlanStore();
  const monthPlanStore = useMonthPlanStore();
  const yearPlanStore = useYearPlanStore();

  const storeAccessors: StoreAccessors = {
    getActivity: activityStore.getActivity,
    getPlanByWeek: weekPlanStore.getPlanByWeek,
    getPlanByMonth: monthPlanStore.getPlanByMonth,
    getPlanByYear: yearPlanStore.getPlanByYear,
    addActivity: activityStore.addActivity,
    addWeekPlan: weekPlanStore.addWeekPlan,
    addActivityToWeek: weekPlanStore.addActivityToWeek,
    addMonthPlan: monthPlanStore.addMonthPlan,
    updateMonthPlan: monthPlanStore.updateMonthPlan,
    addYearPlan: yearPlanStore.addYearPlan,
    updateYearPlan: yearPlanStore.updateYearPlan,
  };

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      setImportSuccess(false);

      try {
        const parsed = JSON.parse(text);
        const result = validateImport(parsed);

        if (!result.valid || !result.data) {
          setErrors(result.errors);
          setImportData(null);
          setPreview(null);
          return;
        }

        setErrors([]);
        setImportData(result.data);

        if (child) {
          const prev = generatePreview(result.data, child.id, storeAccessors);
          setPreview(prev);
          setShowPreview(true);
        }
      } catch {
        setErrors(['Invalid JSON file — could not parse']);
        setImportData(null);
        setPreview(null);
      }
    };
    reader.readAsText(file);
    // Reset so same file can be re-selected
    e.target.value = '';
  }, [child, storeAccessors]);

  const handleConfirmImport = useCallback(() => {
    if (!importData || !child) return;
    applyImport(importData, child.id, storeAccessors);
    setImportSuccess(true);
    setShowPreview(false);
    setImportData(null);
    setPreview(null);
  }, [importData, child, storeAccessors]);

  const handleCancelImport = useCallback(() => {
    setShowPreview(false);
    setImportData(null);
    setPreview(null);
    setErrors([]);
  }, []);

  // Export handlers
  const childWeekPlans = child ? weekPlanStore.getPlansForChild(child.id) : [];
  const childMonthPlans = child ? monthPlanStore.getPlansForChild(child.id) : [];
  const childYearPlans = child ? yearPlanStore.getPlansForChild(child.id) : [];

  const handleExportWeek = (planId: string) => {
    const plan = weekPlanStore.weekPlans.find((p) => p.id === planId);
    if (!plan) return;
    const data = exportWeekPlan(plan, activityStore.getActivity);
    downloadJSON(data, `nurtureos-week-${plan.weekNumber}-${plan.year}.json`);
  };

  const handleExportMonth = (planId: string) => {
    const plan = monthPlanStore.monthPlans.find((p) => p.id === planId);
    if (!plan) return;
    const data = exportMonthPlan(plan, weekPlanStore.weekPlans, activityStore.getActivity);
    downloadJSON(data, `nurtureos-month-${plan.month}-${plan.year}.json`);
  };

  const handleExportYear = (planId: string) => {
    const plan = yearPlanStore.yearPlans.find((p) => p.id === planId);
    if (!plan) return;
    const data = exportYearPlan(plan, monthPlanStore.monthPlans, weekPlanStore.weekPlans, activityStore.getActivity);
    downloadJSON(data, `nurtureos-year-${plan.year}.json`);
  };

  if (!child) {
    return <EmptyState icon="👶" title="No child selected" description="Add a child in Settings first." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-surface-800">Import & Export</h1>
        <p className="text-sm text-surface-500">Import plans from JSON or export existing plans</p>
      </div>

      {/* === IMPORT SECTION === */}
      <section>
        <h2 className="text-sm font-semibold text-surface-700 uppercase tracking-wide mb-3">Import Plan</h2>

        <Card>
          <div className="space-y-3">
            <p className="text-sm text-surface-500">
              Upload a JSON file with a weekly, monthly, or yearly plan. You'll see a preview before anything changes.
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileSelect}
              className="hidden"
            />

            <Button
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
            >
              📁 Choose JSON File
            </Button>

            {/* Errors */}
            {errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="text-xs font-semibold text-red-700 uppercase mb-1">Validation Errors</div>
                {errors.map((err, i) => (
                  <div key={i} className="text-sm text-red-600">• {err}</div>
                ))}
              </div>
            )}

            {/* Success */}
            {importSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                <div className="text-sm text-emerald-700 font-medium">✓ Plan imported successfully!</div>
              </div>
            )}
          </div>
        </Card>
      </section>

      {/* === PREVIEW MODAL === */}
      <Modal isOpen={showPreview} onClose={handleCancelImport} title="Import Preview" size="lg">
        {preview && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="bg-surface-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="primary">{preview.type}</Badge>
                <span className="text-sm font-medium text-surface-700">Import Summary</span>
              </div>
              <p className="text-sm text-surface-500">{preview.summary}</p>
            </div>

            {/* Warnings */}
            {preview.warnings.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="text-xs font-semibold text-amber-700 uppercase mb-1">⚠️ Warnings</div>
                {preview.warnings.map((w, i) => (
                  <div key={i} className="text-sm text-amber-600">• {w}</div>
                ))}
              </div>
            )}

            {/* Months (if monthly/yearly) */}
            {preview.months.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-surface-400 uppercase tracking-wide mb-2">Months</div>
                <div className="space-y-2">
                  {preview.months.map((m) => {
                    const style = ACTION_STYLES[m.action];
                    return (
                      <div key={m.month} className={`rounded-lg p-3 ${style.bg}`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-surface-800">
                            {MONTH_LABELS[m.month as MonthNumber]} — {m.theme}
                          </span>
                          <span className={`text-xs font-medium ${style.text}`}>{style.label}</span>
                        </div>
                        <div className="text-xs text-surface-500">{m.weeks.length} week(s)</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Weeks */}
            <div>
              <div className="text-xs font-semibold text-surface-400 uppercase tracking-wide mb-2">Weeks</div>
              <div className="space-y-1.5">
                {preview.weeks.map((w) => {
                  const style = ACTION_STYLES[w.action];
                  return (
                    <div key={`${w.year}-${w.weekNumber}`} className={`flex items-center justify-between rounded-lg px-3 py-2 ${style.bg}`}>
                      <div>
                        <span className="text-sm font-medium text-surface-700">Week {w.weekNumber}</span>
                        <span className="text-xs text-surface-400 ml-2">{w.details}</span>
                      </div>
                      <span className={`text-xs font-medium ${style.text}`}>{style.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-emerald-50 rounded-lg p-2">
                <div className="text-lg font-bold text-emerald-600">{preview.totalNewActivities}</div>
                <div className="text-[10px] text-surface-400 uppercase">New Activities</div>
              </div>
              <div className="bg-amber-50 rounded-lg p-2">
                <div className="text-lg font-bold text-amber-600">{preview.totalMergedWeeks}</div>
                <div className="text-[10px] text-surface-400 uppercase">Merged Weeks</div>
              </div>
              <div className="bg-surface-100 rounded-lg p-2">
                <div className="text-lg font-bold text-surface-500">{preview.totalSkippedActivities}</div>
                <div className="text-[10px] text-surface-400 uppercase">Already Exist</div>
              </div>
            </div>

            {/* Confirm / Cancel */}
            <div className="flex gap-2 pt-2">
              <Button variant="secondary" fullWidth onClick={handleCancelImport}>Cancel</Button>
              <Button fullWidth onClick={handleConfirmImport}>
                Confirm Import
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* === EXPORT SECTION === */}
      <section>
        <h2 className="text-sm font-semibold text-surface-700 uppercase tracking-wide mb-3">Export Plans</h2>

        {/* Year plans */}
        {childYearPlans.length > 0 && (
          <div className="mb-3">
            <div className="text-xs text-surface-400 uppercase tracking-wide font-medium mb-2">Year Plans</div>
            <div className="space-y-1.5">
              {childYearPlans.map((plan) => (
                <Card key={plan.id} padding="sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-surface-800">Year {plan.year}</span>
                      <span className="text-xs text-surface-400 ml-2">{plan.ageBand} · {plan.goals.length} goals</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleExportYear(plan.id)}>
                      ↓ Export
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Month plans */}
        {childMonthPlans.length > 0 && (
          <div className="mb-3">
            <div className="text-xs text-surface-400 uppercase tracking-wide font-medium mb-2">Month Plans</div>
            <div className="space-y-1.5">
              {childMonthPlans.map((plan) => (
                <Card key={plan.id} padding="sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-surface-800">
                        {MONTH_LABELS[plan.month]} {plan.year}
                      </span>
                      <span className="text-xs text-surface-400 ml-2">{plan.theme}</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleExportMonth(plan.id)}>
                      ↓ Export
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Week plans */}
        {childWeekPlans.length > 0 && (
          <div className="mb-3">
            <div className="text-xs text-surface-400 uppercase tracking-wide font-medium mb-2">Week Plans</div>
            <div className="space-y-1.5">
              {childWeekPlans.slice(-10).reverse().map((plan) => (
                <Card key={plan.id} padding="sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-surface-800">Week {plan.weekNumber}, {plan.year}</span>
                      <span className="text-xs text-surface-400 ml-2">{plan.activities.length} activities</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleExportWeek(plan.id)}>
                      ↓ Export
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {childWeekPlans.length === 0 && childMonthPlans.length === 0 && childYearPlans.length === 0 && (
          <Card>
            <p className="text-sm text-surface-400 text-center py-4">No plans to export yet. Create a weekly plan first.</p>
          </Card>
        )}
      </section>

      {/* === TEMPLATES SECTION === */}
      <section>
        <h2 className="text-sm font-semibold text-surface-700 uppercase tracking-wide mb-3">JSON Templates</h2>
        <Card>
          <p className="text-sm text-surface-500 mb-3">
            Download sample templates to fill in with your own plans, then import them above.
          </p>
          <div className="flex flex-wrap gap-2">
            <a href="/templates/weekly-template.json" download>
              <Button variant="secondary" size="sm">📅 Weekly Template</Button>
            </a>
            <a href="/templates/monthly-template.json" download>
              <Button variant="secondary" size="sm">📆 Monthly Template</Button>
            </a>
            <a href="/templates/yearly-template.json" download>
              <Button variant="secondary" size="sm">📋 Yearly Template</Button>
            </a>
          </div>
        </Card>
      </section>
    </div>
  );
}
