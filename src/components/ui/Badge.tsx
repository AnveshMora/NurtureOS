import type { ReactNode } from 'react';

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'purple';

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-surface-100 text-surface-600',
  primary: 'bg-primary-100 text-primary-700',
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  danger: 'bg-red-50 text-red-700',
  purple: 'bg-violet-50 text-violet-700',
};

export function Badge({ variant = 'default', children, className = '' }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
        ${variantClasses[variant]}
        ${className}
      `.trim()}
    >
      {children}
    </span>
  );
}
