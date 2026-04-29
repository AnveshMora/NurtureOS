import { useState, useMemo } from 'react';
import { getCurrentWeekNumber, getCurrentYear, navigateWeek, formatWeekRange, getWeekRange } from '../lib/dateUtils';

export function useCurrentWeek(initial?: { weekNumber: number; year: number }) {
  const [weekNumber, setWeekNumber] = useState(() => initial?.weekNumber ?? getCurrentWeekNumber());
  const [year, setYear] = useState(() => initial?.year ?? getCurrentYear());

  const goNext = () => {
    const next = navigateWeek(weekNumber, year, 'next');
    setWeekNumber(next.weekNumber);
    setYear(next.year);
  };

  const goPrev = () => {
    const prev = navigateWeek(weekNumber, year, 'prev');
    setWeekNumber(prev.weekNumber);
    setYear(prev.year);
  };

  const goToCurrentWeek = () => {
    setWeekNumber(getCurrentWeekNumber());
    setYear(getCurrentYear());
  };

  const isCurrentWeek =
    weekNumber === getCurrentWeekNumber() && year === getCurrentYear();

  const weekRange = useMemo(
    () => formatWeekRange(weekNumber, year),
    [weekNumber, year]
  );

  const { start, end } = useMemo(
    () => getWeekRange(weekNumber, year),
    [weekNumber, year]
  );

  return {
    weekNumber,
    year,
    weekRange,
    weekStart: start,
    weekEnd: end,
    isCurrentWeek,
    goNext,
    goPrev,
    goToCurrentWeek,
  };
}
