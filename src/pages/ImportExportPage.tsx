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
import { parseDatasetFiles, adaptDataset } from '../lib/datasetAdapter';

const ACTION_STYLES: Record<PreviewAction, { bg: string; text: string; label: string }> = {
  create: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: '✨ New' },
  merge: { bg: 'bg-amber-50', text: 'text-amber-700', label: '🔄 Merge' },
  skip: { bg: 'bg-surface-100', text: 'text-surface-500', label: '⏭️ Skip' },
};

export function ImportExportPage() {
  const { child } = useActiveChild();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const datasetInputRef = useRef<HTMLInputElement>(null);

  // Import state
  const [importData, setImportData] = useState<PlanImport | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [importStatus, setImportStatus] = useState<
    'idle' | 'reading' | 'validating' | 'ready' | 'importing' | 'done'
  >('idle');
  const [importSummary, setImportSummary] = useState('');

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

    setImportStatus('reading');
    setErrors([]);
    setWarnings([]);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      setImportStatus('validating');

      try {
        const parsed = JSON.parse(text);
        const result = validateImport(parsed);

        if (!result.valid || !result.data) {
          setErrors(result.errors);
          setImportData(null);
          setPreview(null);
          setImportStatus('idle');
          return;
        }

        setErrors([]);
        setImportData(result.data);

        if (child) {
          const prev = generatePreview(result.data, child.id, storeAccessors);
          setPreview(prev);
          setImportStatus('ready');
          setShowPreview(true);
        }
      } catch {
        setErrors(['Invalid JSON file — could not parse']);
        setImportData(null);
        setPreview(null);
        setImportStatus('idle');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, [child, storeAccessors]);

  const handleDatasetSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    setImportStatus('reading');
    setErrors([]);
    setWarnings([]);

    const entries: { name: string; content: string }[] = [];
    let loaded = 0;

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const reader = new FileReader();
      reader.onload = (evt) => {
        entries.push({ name: file.name, content: evt.target?.result as string });
        loaded++;

        if (loaded === fileList.length) {
          setImportStatus('validating');

          const { files, errors: parseErrors } = parseDatasetFiles(entries);
          if (parseErrors.length > 0) {
            setErrors(parseErrors);
          }

          const result = adaptDataset(files);
          if (!result.valid || !result.data) {
            setErrors((prev) => [...prev, ...result.errors]);
            setWarnings(result.warnings);
            setImportData(null);
            setPreview(null);
            setImportStatus('idle');
            return;
          }

          setWarnings(result.warnings);
          setImportData(result.data);

          if (child) {
            const prev = generatePreview(result.data, child.id, storeAccessors);
            prev.warnings = [...result.warnings, ...prev.warnings];
            setPreview(prev);
            setImportStatus('ready');
            setShowPreview(true);
          }
        }
      };
      reader.readAsText(file);
    }

    e.target.value = '';
  }, [child, storeAccessors]);

  const handleConfirmImport = useCallback(() => {
    if (!importData || !child) return;
    setImportStatus('importing');

    // Small delay to show the "importing" state visually
    setTimeout(() => {
      applyImport(importData, child.id, storeAccessors);

      const summary = preview
        ? `${preview.type} plan · ${preview.totalNewActivities} activities added · ${preview.totalNewWeeks} new week(s)`
        : 'Plan imported';

      setImportSummary(summary);
      setImportStatus('done');
      setShowPreview(false);
      setImportData(null);
      setPreview(null);
    }, 100);
  }, [importData, child, storeAccessors, preview]);

  const handleCancelImport = useCallback(() => {
    setShowPreview(false);
    setImportData(null);
    setPreview(null);
    setErrors([]);
    setWarnings([]);
    setImportStatus('idle');
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
              Upload a single NurtureOS JSON file, or select multiple dataset files (activity_library, weeks, months, year).
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileSelect}
              className="hidden"
            />

            <input
              ref={datasetInputRef}
              type="file"
              accept=".json,application/json"
              multiple
              onChange={handleDatasetSelect}
              className="hidden"
            />

            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
              >
                📁 Single JSON File
              </Button>
              <Button
                variant="secondary"
                onClick={() => datasetInputRef.current?.click()}
              >
                📂 Dataset (Multiple Files)
              </Button>
            </div>

            <p className="text-xs text-surface-400">
              Dataset import: select all your JSON files at once — activity_library.json, weeks.json, months.json, year.json
            </p>

            {/* Errors */}
            {errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="text-xs font-semibold text-red-700 uppercase mb-1">Validation Errors</div>
                {errors.map((err, i) => (
                  <div key={i} className="text-sm text-red-600">• {err}</div>
                ))}
              </div>
            )}

            {/* Warnings (outside modal, for dataset parse phase) */}
            {warnings.length > 0 && !showPreview && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="text-xs font-semibold text-amber-700 uppercase mb-1">⚠️ Warnings</div>
                {warnings.map((w, i) => (
                  <div key={i} className="text-sm text-amber-600">• {w}</div>
                ))}
              </div>
            )}

            {/* Status Indicator */}
            {importStatus === 'reading' && (
              <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-blue-700 font-medium">Reading files…</span>
              </div>
            )}
            {importStatus === 'validating' && (
              <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-blue-700 font-medium">Validating & preparing preview…</span>
              </div>
            )}
            {importStatus === 'importing' && (
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="h-4 w-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-amber-700 font-medium">Importing plan…</span>
              </div>
            )}
            {importStatus === 'done' && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-600 text-lg">✓</span>
                  <div>
                    <div className="text-sm text-emerald-700 font-medium">Import complete!</div>
                    {importSummary && <div className="text-xs text-emerald-600 mt-0.5">{importSummary}</div>}
                  </div>
                </div>
                <button
                  onClick={() => { setImportStatus('idle'); setImportSummary(''); }}
                  className="text-xs text-emerald-500 underline mt-2"
                >
                  Dismiss
                </button>
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
