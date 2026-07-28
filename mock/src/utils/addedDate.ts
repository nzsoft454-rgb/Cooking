import i18n from '../i18n';
import { localTodayKey } from './dateKey';

/** 入庫日（YYYY-MM-DD）から今日までの経過日数 */
export function daysSinceAdded(addedDate: string, now = new Date()): number {
  const today = localTodayKey(now);
  const start = new Date(`${addedDate}T12:00:00`);
  const end = new Date(`${today}T12:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  return Math.max(0, Math.floor((end.getTime() - start.getTime()) / 86_400_000));
}

export function formatAddedShort(addedDate: string, now = new Date()): string {
  const days = daysSinceAdded(addedDate, now);
  if (days === 0) return i18n.t('addedDate.today');
  if (days === 1) return i18n.t('addedDate.yesterday');
  return i18n.t('addedDate.daysAgo', { count: days });
}

export function formatAddedDisplay(addedDate: string): string {
  const [, m, day] = addedDate.split('-');
  if (!m || !day) return addedDate;
  return i18n.t('addedDate.onDate', { date: `${Number(m)}/${Number(day)}` });
}

/** デモ通知: 入庫から一定日数以上の食材 */
export const LONG_STORED_DAYS = 7;

export function isLongStored(addedDate: string, now = new Date()): boolean {
  return daysSinceAdded(addedDate, now) >= LONG_STORED_DAYS;
}
