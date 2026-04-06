import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="space-y-1">
        {label && (
          <label className="block text-xs font-medium text-surface-600 uppercase tracking-wide">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`
            w-full px-3 py-2 text-sm bg-white border rounded-md
            placeholder:text-surface-400
            focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500
            ${error ? 'border-red-300' : 'border-surface-200'}
            ${className}
          `.trim()}
          {...props}
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="space-y-1">
        {label && (
          <label className="block text-xs font-medium text-surface-600 uppercase tracking-wide">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={`
            w-full px-3 py-2 text-sm bg-white border rounded-md resize-y min-h-[80px]
            placeholder:text-surface-400
            focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500
            ${error ? 'border-red-300' : 'border-surface-200'}
            ${className}
          `.trim()}
          {...props}
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    );
  }
);
TextArea.displayName = 'TextArea';
