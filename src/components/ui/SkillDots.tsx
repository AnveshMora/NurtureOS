import { SKILL_NODES } from '../../lib/skillMapping';
import { SKILL_NODE_LABELS } from '../../types';
import type { SkillMapping } from '../../types';

interface SkillDotsProps {
  mapping: SkillMapping;
  showLabels?: boolean;
  size?: 'sm' | 'md';
}

const skillColors: Record<string, string> = {
  curiosity: 'bg-blue-400',
  firstPrinciples: 'bg-violet-400',
  problemSolving: 'bg-cyan-400',
  communication: 'bg-emerald-400',
  grit: 'bg-amber-400',
  arts: 'bg-pink-400',
};

export function SkillDots({ mapping, showLabels = false, size = 'sm' }: SkillDotsProps) {
  const dotSize = size === 'sm' ? 'w-2 h-2' : 'w-3 h-3';

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {SKILL_NODES.map((node) => {
        const score = mapping[node];
        if (score < 3) return null;
        return (
          <div key={node} className="flex items-center gap-1" title={`${SKILL_NODE_LABELS[node]}: ${score}/5`}>
            <span
              className={`${dotSize} rounded-full ${skillColors[node]}`}
              style={{ opacity: 0.4 + (score / 5) * 0.6 }}
            />
            {showLabels && (
              <span className="text-xs text-surface-500">{SKILL_NODE_LABELS[node]}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
