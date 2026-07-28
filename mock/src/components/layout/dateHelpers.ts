import { addLocalDays, localTodayKey } from '../../utils/dateKey';

export const formatDateKey = localTodayKey;

export function addDaysFromToday(days: number): string {
  return addLocalDays(new Date(), days);
}

export function formatDisplayDate(iso: string): string {
  const [, m, day] = iso.split('-');
  if (!m || !day) return iso;
  return `${Number(m)}/${Number(day)}`;
}
