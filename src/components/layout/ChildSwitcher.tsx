import { useState, useRef, useEffect } from 'react';
import { useActiveChild } from '../../hooks/useActiveChild';
import { formatAge } from '../../lib/dateUtils';
import { AGE_BAND_LABELS } from '../../types';

export function ChildSwitcher() {
  const { child, children, setActiveChild, hasChildren } = useActiveChild();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!hasChildren || !child) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2.5 py-1 rounded-md hover:bg-surface-50 transition-colors"
      >
        <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center text-xs font-semibold text-primary-700">
          {child.name.charAt(0).toUpperCase()}
        </div>
        <div className="text-left hidden sm:block">
          <div className="text-sm font-medium text-surface-800 leading-tight">{child.name}</div>
          <div className="text-[10px] text-surface-400 leading-tight">
            {formatAge(child.dateOfBirth)} · {AGE_BAND_LABELS[child.ageBand]}
          </div>
        </div>
        {children.length > 1 && (
          <svg
            className={`w-3.5 h-3.5 text-surface-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>

      {isOpen && children.length > 1 && (
        <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-lg border border-surface-200 shadow-lg py-1 z-50">
          {children.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                setActiveChild(c.id);
                setIsOpen(false);
              }}
              className={`
                w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-surface-50 transition-colors
                ${c.id === child.id ? 'bg-primary-50' : ''}
              `}
            >
              <div className={`
                w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold
                ${c.id === child.id ? 'bg-primary-500 text-white' : 'bg-surface-100 text-surface-600'}
              `}>
                {c.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="text-sm font-medium text-surface-800">{c.name}</div>
                <div className="text-[10px] text-surface-400">
                  {formatAge(c.dateOfBirth)} · {AGE_BAND_LABELS[c.ageBand]}
                </div>
              </div>
              {c.id === child.id && (
                <svg className="w-4 h-4 text-primary-500 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
