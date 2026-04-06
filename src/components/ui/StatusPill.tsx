import type { ActivityStatus, PlanStatus } from '../../types';

type Status = ActivityStatus | PlanStatus;

interface StatusPillProps {
  status: Status;
  size?: 'sm' | 'md';
  className?: string;
}

const statusConfig: Record<Status, { label: string; dotColor: string; bgColor: string; textColor: string }> = {
  pending: {
    label: 'Pending',
    dotColor: 'bg-surface-400',
    bgColor: 'bg-surface-100',
    textColor: 'text-surface-600',
  },
  'in-progress': {
    label: 'In Progress',
    dotColor: 'bg-amber-400',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-700',
  },
  completed: {
    label: 'Completed',
    dotColor: 'bg-emerald-400',
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-700',
  },
  skipped: {
    label: 'Skipped',
    dotColor: 'bg-violet-400',
    bgColor: 'bg-violet-50',
    textColor: 'text-violet-700',
  },
};

export function StatusPill({ status, size = 'sm', className = '' }: StatusPillProps) {
  const config = statusConfig[status];
  if (!config) return null;

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm';
  const dotSize = size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2';

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full font-medium
        ${config.bgColor} ${config.textColor} ${sizeClasses}
        ${className}
      `.trim()}
    >
      <span className={`${dotSize} rounded-full ${config.dotColor}`} />
      {config.label}
    </span>
  );
}
