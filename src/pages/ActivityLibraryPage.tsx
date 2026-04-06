import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, Badge, Input, SkillDots, EmptyState } from '../components/ui';
import { useActivityStore } from '../store';
import { useAgeBand } from '../hooks/useAgeBand';
import { CATEGORY_LABELS, CATEGORY_ICONS, DURATION_LABELS } from '../types';
import type { ActivityCategory } from '../types';
import { getPrimarySkill } from '../lib/skillMapping';
import { SKILL_NODE_LABELS } from '../types';

const ALL_CATEGORIES: ActivityCategory[] = [
  'practical-life', 'sensorial', 'language', 'math',
  'nature-science', 'arts-movement', 'social-grace',
];

export function ActivityLibraryPage() {
  const activities = useActivityStore((s) => s.activities);
  const ageBandInfo = useAgeBand();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ActivityCategory | 'all'>('all');
  const [ageBandFilter, setAgeBandFilter] = useState<boolean>(true);

  const filtered = useMemo(() => {
    return activities.filter((a) => {
      if (search && !a.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (categoryFilter !== 'all' && a.category !== categoryFilter) return false;
      if (ageBandFilter && ageBandInfo && !a.ageBands.includes(ageBandInfo.ageBand)) return false;
      return true;
    });
  }, [activities, search, categoryFilter, ageBandFilter, ageBandInfo]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-surface-800">Activity Library</h1>
        <p className="text-sm text-surface-500">
          {activities.length} activities · {filtered.length} shown
        </p>
      </div>

      {/* Search */}
      <Input
        placeholder="Search activities..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Filters */}
      <div className="space-y-2">
        {/* Category chips */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
              categoryFilter === 'all'
                ? 'bg-primary-500 text-white'
                : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
            }`}
          >
            All
          </button>
          {ALL_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat === categoryFilter ? 'all' : cat)}
              className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                categoryFilter === cat
                  ? 'bg-primary-500 text-white'
                  : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
              }`}
            >
              {CATEGORY_ICONS[cat]} {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>

        {/* Age band toggle */}
        {ageBandInfo && (
          <label className="flex items-center gap-2 text-xs text-surface-500 cursor-pointer">
            <input
              type="checkbox"
              checked={ageBandFilter}
              onChange={(e) => setAgeBandFilter(e.target.checked)}
              className="rounded border-surface-300 text-primary-500 focus:ring-primary-500"
            />
            Show only {ageBandInfo.label} activities
          </label>
        )}
      </div>

      {/* Activity List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon="📚"
          title="No activities found"
          description="Try adjusting your filters or search."
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((activity) => (
            <Link key={activity.id} to={`/activities/${activity.id}`}>
              <Card hover padding="sm">
                <div className="flex items-center gap-3">
                  <div className="text-xl shrink-0">
                    {CATEGORY_ICONS[activity.category]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-surface-800 truncate">
                        {activity.title}
                      </span>
                      {activity.isCustom && (
                        <Badge variant="purple">Custom</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-surface-400">
                        {DURATION_LABELS[activity.duration]}
                      </span>
                      <span className="text-xs text-surface-300">·</span>
                      <span className="text-xs text-surface-400">
                        {SKILL_NODE_LABELS[getPrimarySkill(activity.skillMapping)]}
                      </span>
                      <span className="text-xs text-surface-300">·</span>
                      <SkillDots mapping={activity.skillMapping} />
                    </div>
                  </div>
                  <svg className="w-4 h-4 text-surface-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
