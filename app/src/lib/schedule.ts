// Date math on local calendar days ("YYYY-MM-DD"), so a session logged at 23:50 stays on that day.

export type Day = string;

export interface Session {
  id: number;
  day: Day;
  /** ISO timestamp when it was logged. */
  loggedAt: string;
  pain: number | null;
  note: string | null;
}

const pad = (n: number) => String(n).padStart(2, '0');

export function toDay(d: Date): Day {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseDay(day: Day): Date {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(day: Day, n: number): Day {
  const d = parseDay(day);
  d.setDate(d.getDate() + n);
  return toDay(d);
}

export function weekday(day: Day): number {
  return parseDay(day).getDay();
}

/** Whole days from a to b (b - a). */
export function daysBetween(a: Day, b: Day): number {
  return Math.round((parseDay(b).getTime() - parseDay(a).getTime()) / 86_400_000);
}

export function isPlannedDay(days: number[], day: Day): boolean {
  return days.includes(weekday(day));
}

export interface WeekStat {
  /** 1-based week number since the routine started. */
  week: number;
  start: Day;
  end: Day;
  planned: number;
  /** Distinct days with at least one logged session. */
  done: number;
}

/**
 * Week-by-week completion since the routine started (the pilots' main measure).
 * Weeks are 7-day windows from the start day. The current week counts up to today only.
 */
export function weekStats(start: Day, days: number[], sessions: Session[], today: Day): WeekStat[] {
  const doneDays = new Set(sessions.map((s) => s.day));
  const out: WeekStat[] = [];
  for (let w = 0; daysBetween(addDays(start, w * 7), today) >= 0; w++) {
    const ws = addDays(start, w * 7);
    const we = addDays(ws, 6);
    let planned = 0;
    let done = 0;
    for (let i = 0; i < 7; i++) {
      const d = addDays(ws, i);
      if (daysBetween(d, today) < 0) break;
      if (days.includes(weekday(d))) planned++;
      if (doneDays.has(d)) done++;
    }
    out.push({ week: w + 1, start: ws, end: we, planned, done });
  }
  return out;
}

/** Notification weekdays use 1 = Sunday … 7 = Saturday. */
export function toNotificationWeekday(jsDay: number): number {
  return jsDay + 1;
}

/** Sessions with a pain score, oldest first, for the trend chart. */
export function painTrend(sessions: Session[]): { day: Day; pain: number }[] {
  return sessions
    .filter((s): s is Session & { pain: number } => s.pain != null)
    .sort((a, b) => a.loggedAt.localeCompare(b.loggedAt))
    .map((s) => ({ day: s.day, pain: s.pain }));
}

/** Calendar grid of the last `weeks` weeks ending this week, Sunday first. */
export function calendarDays(today: Day, weeks: number): Day[] {
  const start = addDays(today, -weekday(today) - 7 * (weeks - 1));
  return Array.from({ length: weeks * 7 }, (_, i) => addDays(start, i));
}
