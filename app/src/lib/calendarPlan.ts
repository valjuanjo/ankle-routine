// What "Add to calendar" puts in the patient's calendar. Pure, so it can be tested without a device.
// Calendars often sync to Google or iCloud, so the event carries only the title and, if the patient
// keeps it on, the exercise list. Never pain scores or notes.
import { exerciseById, type Lang } from './content';
import { doseText, type RoutineInfo } from './format';
import { strings } from './i18n';
import type { Routine } from './routineCode';
import { addDays, parseDay, toDay, weekday, type Day } from './schedule';

export interface CalendarPlanInput {
  routine: Routine;
  info: RoutineInfo;
  lang: Lang;
  /** First day events may start, YYYY-MM-DD. */
  from: Day;
  weeks: number;
  /** "HH:MM", local time. */
  time: string;
  includeExercises: boolean;
}

export interface PlannedEvent {
  /** JS weekday, 0 = Sunday. */
  weekday: number;
  /** First occurrence, YYYY-MM-DD. */
  firstDay: Day;
}

export interface CalendarPlan {
  title: string;
  notes: string;
  hour: number;
  minute: number;
  durationMinutes: number;
  /** Last day an occurrence may fall on, YYYY-MM-DD. */
  lastDay: Day;
  /** One weekly repeating event per routine day. */
  events: PlannedEvent[];
  /** Alarm minutes before the start. */
  alarmMinutesBefore: number;
}

const ALARM_MINUTES = 15;

export function parseHHMM(v: string): { hour: number; minute: number } {
  const m = /^(\d{1,2}):(\d{2})$/.exec(v);
  const hour = m ? Number(m[1]) : 18;
  const minute = m ? Number(m[2]) : 0;
  return hour < 24 && minute < 60 ? { hour, minute } : { hour: 18, minute: 0 };
}

/** Today if the session time is still ahead, otherwise tomorrow, so the first event isn't already in the past. */
export function firstPlanDay(now: Date, time: string): Day {
  const { hour, minute } = parseHHMM(time);
  const today = toDay(now);
  return now.getHours() * 60 + now.getMinutes() < hour * 60 + minute ? today : addDays(today, 1);
}

/** About 2 minutes per set plus a little setup, rounded to 5 minutes, between 15 and 45. */
export function estimateMinutes(r: Routine): number {
  const sets = r.items.reduce((n, it) => n + it.sets, 0);
  return Math.min(45, Math.max(15, Math.ceil((sets * 2 + 5) / 5) * 5));
}

export function buildCalendarPlan(p: CalendarPlanInput): CalendarPlan {
  const s = strings[p.lang];
  const lastDay = addDays(p.from, p.weeks * 7 - 1);
  const events = [...p.routine.days]
    .sort((a, b) => a - b)
    .map((wd) => ({ weekday: wd, firstDay: addDays(p.from, (wd - weekday(p.from) + 7) % 7) }));
  const lines = [p.info.stage ? `${p.info.title} · ${p.info.stage}` : p.info.title];
  if (p.includeExercises) {
    lines.push('', ...p.routine.items.map((it) => `• ${exerciseById[it.ex]?.name[p.lang] ?? it.ex}: ${doseText(it, s)}`));
  }
  lines.push('', s.calendarEventFooter);
  return {
    title: s.calendarEventTitle,
    notes: lines.join('\n'),
    ...parseHHMM(p.time),
    durationMinutes: estimateMinutes(p.routine),
    lastDay,
    events,
    alarmMinutesBefore: ALARM_MINUTES,
  };
}

/** Local start and end of the first occurrence of an event. */
export function occurrence(plan: CalendarPlan, ev: PlannedEvent): { start: Date; end: Date } {
  const start = parseDay(ev.firstDay);
  start.setHours(plan.hour, plan.minute, 0, 0);
  return { start, end: new Date(start.getTime() + plan.durationMinutes * 60_000) };
}

/** End of the last day, as the recurrence end. */
export function recurrenceEnd(plan: CalendarPlan): Date {
  const d = parseDay(plan.lastDay);
  d.setHours(23, 59, 0, 0);
  return d;
}

// ---- iCalendar (.ics, RFC 5545) for any calendar app, and the web ----

const BYDAY = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
const pad = (n: number) => String(n).padStart(2, '0');
/** Floating local time ("at 18:00 wherever I am"), which is what a home routine means. */
const localStamp = (d: Date) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
const utcStamp = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

export function icsEscape(v: string): string {
  return v.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1');
}

/** Folds lines longer than 75 octets, without splitting a UTF-8 character. */
export function icsFold(line: string): string {
  const enc = new TextEncoder();
  const out: string[] = [];
  let cur = '';
  let curBytes = 0;
  for (const ch of line) {
    const b = enc.encode(ch).length;
    const limit = out.length ? 74 : 75; // continuation lines start with a space
    if (curBytes + b > limit) {
      out.push(cur);
      cur = '';
      curBytes = 0;
    }
    cur += ch;
    curBytes += b;
  }
  out.push(cur);
  return out.join('\r\n ');
}

/** One VEVENT per routine day, each repeating weekly until the last day. `uidSeed` keeps UIDs stable for re-imports. */
export function buildIcs(plan: CalendarPlan, uidSeed: string, now = new Date()): string {
  // RFC 5545: with a floating DTSTART, UNTIL must be floating local time too.
  const until = localStamp(recurrenceEnd(plan));
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Ankle Routine//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'];
  for (const ev of plan.events) {
    const { start, end } = occurrence(plan, ev);
    lines.push(
      'BEGIN:VEVENT',
      `UID:${uidSeed}-${BYDAY[ev.weekday].toLowerCase()}@ankleroutine.app`,
      `DTSTAMP:${utcStamp(now)}`,
      `DTSTART:${localStamp(start)}`,
      `DTEND:${localStamp(end)}`,
      `RRULE:FREQ=WEEKLY;BYDAY=${BYDAY[ev.weekday]};UNTIL=${until}`,
      `SUMMARY:${icsEscape(plan.title)}`,
      `DESCRIPTION:${icsEscape(plan.notes)}`,
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:${icsEscape(plan.title)}`,
      `TRIGGER:-PT${plan.alarmMinutesBefore}M`,
      'END:VALARM',
      'END:VEVENT',
    );
  }
  lines.push('END:VCALENDAR');
  return lines.map(icsFold).join('\r\n') + '\r\n';
}
