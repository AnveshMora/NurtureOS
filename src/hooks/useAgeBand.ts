import { useMemo } from 'react';
import { useActiveChild } from './useActiveChild';
import { calculateAgeBand, formatAge } from '../lib/dateUtils';
import { AGE_BAND_LABELS, AGE_BAND_FOCUS } from '../types';

export function useAgeBand() {
  const { child } = useActiveChild();

  return useMemo(() => {
    if (!child) return null;

    const ageBand = calculateAgeBand(child.dateOfBirth);
    return {
      ageBand,
      label: AGE_BAND_LABELS[ageBand],
      focus: AGE_BAND_FOCUS[ageBand],
      formattedAge: formatAge(child.dateOfBirth),
    };
  }, [child]);
}
