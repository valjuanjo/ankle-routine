// Writes the routine into the phone's own calendar, or exports it as an .ics file.
// iOS asks for write-only access: the app can add events but never reads the patient's calendar.
import * as Calendar from 'expo-calendar';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { buildIcs, occurrence, recurrenceEnd, type CalendarPlan } from './calendarPlan';

export type AddResult =
  | { ok: true; eventIds: string[] }
  | { ok: false; reason: 'denied' | 'no_calendar' | 'error' };

const DAY_OF_WEEK = [
  Calendar.DayOfTheWeek.Sunday, Calendar.DayOfTheWeek.Monday, Calendar.DayOfTheWeek.Tuesday, Calendar.DayOfTheWeek.Wednesday,
  Calendar.DayOfTheWeek.Thursday, Calendar.DayOfTheWeek.Friday, Calendar.DayOfTheWeek.Saturday,
];

export const nativeCalendarAvailable = Platform.OS === 'ios' || Platform.OS === 'android';

async function writableCalendar(): Promise<Calendar.ExpoCalendar | null> {
  if (Platform.OS === 'ios') return Calendar.getDefaultCalendarSync();
  // Android has no single default calendar: prefer an account's primary calendar.
  const all = (await Calendar.getCalendars(Calendar.EntityTypes.EVENT)).filter((c) => c.allowsModifications);
  return all.find((c) => c.isPrimary) ?? all[0] ?? null;
}

export async function addToDeviceCalendar(plan: CalendarPlan): Promise<AddResult> {
  try {
    const perm = await Calendar.requestCalendarPermissions(true);
    if (!perm.granted) return { ok: false, reason: 'denied' };
    const cal = await writableCalendar();
    if (!cal) return { ok: false, reason: 'no_calendar' };
    const endDate = recurrenceEnd(plan);
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const ids: string[] = [];
    for (const ev of plan.events) {
      const { start, end } = occurrence(plan, ev);
      const created = await cal.createEvent({
        title: plan.title,
        notes: plan.notes,
        startDate: start,
        endDate: end,
        timeZone,
        alarms: [{ relativeOffset: -plan.alarmMinutesBefore }],
        recurrenceRule: {
          frequency: Calendar.Frequency.WEEKLY,
          endDate,
          ...(Platform.OS === 'ios' ? { daysOfTheWeek: [{ dayOfTheWeek: DAY_OF_WEEK[ev.weekday] }] } : {}),
        },
      });
      ids.push(created.id);
    }
    return { ok: true, eventIds: ids };
  } catch (e) {
    console.warn('Could not add calendar events', e);
    return { ok: false, reason: 'error' };
  }
}

/**
 * Removes events this app created earlier. With iOS write-only access the app can't look events up,
 * so this can fail there; the caller then asks the patient to delete them in their calendar app.
 */
export async function removeFromDeviceCalendar(eventIds: string[]): Promise<{ removed: number; failed: number }> {
  let removed = 0;
  for (const id of eventIds) {
    try {
      const ev = await Calendar.ExpoCalendarEvent.get(id);
      await ev.delete();
      removed++;
    } catch {
      // Already deleted by the patient, or not readable with write-only access.
    }
  }
  return { removed, failed: eventIds.length - removed };
}

/** Shares (phone) or downloads (web) an .ics file the patient can open in any calendar app. */
export async function exportIcs(plan: CalendarPlan, uidSeed: string, dialogTitle: string): Promise<void> {
  const ics = buildIcs(plan, uidSeed);
  const name = 'ankle-routine.ics';
  if (Platform.OS === 'web') {
    const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return;
  }
  const file = new File(Paths.cache, name);
  if (file.exists) file.delete();
  file.create();
  file.write(ics);
  await Sharing.shareAsync(file.uri, { mimeType: 'text/calendar', UTI: 'com.apple.ical.ics', dialogTitle });
}
