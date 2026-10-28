// Local notifications on routine days. Scheduled on the phone; nothing is sent anywhere.
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { Strings } from './i18n';
import { toNotificationWeekday } from './schedule';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const CHANNEL = 'routine-reminders';

/** Parses "HH:MM"; falls back to 18:00. */
export function parseTime(v: string | undefined): { hour: number; minute: number } {
  const m = /^(\d{1,2}):(\d{2})$/.exec(v ?? '');
  const hour = m ? Number(m[1]) : 18;
  const minute = m ? Number(m[2]) : 0;
  return hour < 24 && minute < 60 ? { hour, minute } : { hour: 18, minute: 0 };
}

export async function ensurePermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  return (await Notifications.requestPermissionsAsync()).granted;
}

/** Replaces all reminders with one weekly reminder per routine day. Returns false if permission is missing. */
export async function scheduleReminders(days: number[], time: string, s: Strings): Promise<boolean> {
  // Reminders are a convenience: never let them block saving a routine.
  try {
    return await schedule(days, time, s);
  } catch (e) {
    console.warn('Could not schedule reminders', e);
    return false;
  }
}

async function schedule(days: number[], time: string, s: Strings): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!days.length) return true;
  if (!(await ensurePermission())) return false;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL, { name: s.reminders, importance: Notifications.AndroidImportance.DEFAULT });
  }
  const { hour, minute } = parseTime(time);
  for (const d of days) {
    await Notifications.scheduleNotificationAsync({
      content: { title: s.reminderTitle, body: s.reminderBody },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.WEEKLY, weekday: toNotificationWeekday(d), hour, minute, channelId: CHANNEL },
    });
  }
  return true;
}

export async function cancelReminders(): Promise<void> {
  if (Platform.OS === 'web') return;
  await Notifications.cancelAllScheduledNotificationsAsync().catch((e) => console.warn('Could not cancel reminders', e));
}
