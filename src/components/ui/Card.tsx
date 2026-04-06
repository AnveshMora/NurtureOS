import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
}

const paddingClasses = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-5',
};

export function Card({
  children,
  padding = 'md',
  hover = false,
  className = '',
  ...props
}: CardProps) {
  return (
    <div
      className={`
        bg-white rounded-lg border border-surface-200
        ${paddingClasses[padding]}
        ${hover ? 'hover:border-surface-300 hover:shadow-sm transition-all duration-150 cursor-pointer' : ''}
        ${className}
      `.trim()}
      {...props}
    >
      {children}
    </div>
  );
}
