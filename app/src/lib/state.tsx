import { getLocales } from 'expo-localization';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Country, Lang } from './content';
import * as db from './db';
import { strings, type Strings } from './i18n';
import { cancelReminders, scheduleReminders } from './reminders';
import type { Routine } from './routineCode';
import { toDay, type Session } from './schedule';

export interface Settings {
  lang: Lang;
  country: Country;
  onboarded: boolean;
  remindersOn: boolean;
  reminderTime: string;
  /** When the patient accepted the onboarding consent, ISO timestamp. */
  consentAt?: string;
  /** JSON array of calendar event ids this app created, so they can be replaced or removed. */
  calendarEventIds?: string;
  /** Routine id those events were created for. */
  calendarRoutineId?: string;
}

interface AppState {
  ready: boolean;
  settings: Settings;
  s: Strings;
  routine: db.StoredRoutine | null;
  sessions: Session[];
  update: (patch: Partial<Settings>) => Promise<void>;
  loadRoutine: (r: Routine) => Promise<void>;
  logSession: (pain: number | null, note: string | null) => Promise<void>;
  removeSession: (id: number) => Promise<void>;
  /** Returns false when the phone has notifications turned off for the app. */
  applyReminders: (on: boolean, time: string) => Promise<boolean>;
  resetAll: () => Promise<void>;
}

function defaultSettings(): Settings {
  const locale = getLocales()[0];
  return {
    lang: locale?.languageCode === 'en' ? 'en' : 'es',
    country: locale?.regionCode === 'US' ? 'US' : 'PE',
    onboarded: false,
    remindersOn: true,
    reminderTime: '18:00',
  };
}

function fromStored(raw: Record<string, string>): Settings {
  const d = defaultSettings();
  return {
    lang: raw.lang === 'en' || raw.lang === 'es' ? raw.lang : d.lang,
    country: raw.country === 'US' || raw.country === 'PE' ? raw.country : d.country,
    onboarded: raw.onboarded === '1',
    remindersOn: raw.remindersOn ? raw.remindersOn === '1' : d.remindersOn,
    reminderTime: raw.reminderTime ?? d.reminderTime,
    consentAt: raw.consentAt,
    calendarEventIds: raw.calendarEventIds,
    calendarRoutineId: raw.calendarRoutineId,
  };
}

const Ctx = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [routine, setRoutine] = useState<db.StoredRoutine | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    (async () => {
      await db.migrate();
      setSettings(fromStored(await db.getSettings()));
      setRoutine(await db.getActiveRoutine());
      setSessions(await db.getSessions());
      setReady(true);
    })();
  }, []);

  const update = useCallback(async (patch: Partial<Settings>) => {
    for (const [k, v] of Object.entries(patch)) {
      if (v === undefined) continue;
      await db.setSetting(k, typeof v === 'boolean' ? (v ? '1' : '0') : String(v));
    }
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const applyReminders = useCallback(
    async (on: boolean, time: string, days = routine?.routine.days ?? []) => {
      await update({ remindersOn: on, reminderTime: time });
      if (!on) {
        await cancelReminders();
        return true;
      }
      return scheduleReminders(days, time, strings[settings.lang]);
    },
    [routine, settings.lang, update],
  );

  const loadRoutine = useCallback(
    async (r: Routine) => {
      const stored = await db.setActiveRoutine(r, toDay(new Date()));
      setRoutine(stored);
      if (settings.remindersOn) await scheduleReminders(r.days, settings.reminderTime, strings[settings.lang]);
    },
    [settings],
  );

  const logSession = useCallback(
    async (pain: number | null, note: string | null) => {
      const now = new Date();
      await db.addSession({ day: toDay(now), loggedAt: now.toISOString(), pain, note }, routine?.id ?? null);
      setSessions(await db.getSessions());
    },
    [routine],
  );

  const removeSession = useCallback(async (id: number) => {
    await db.deleteSession(id);
    setSessions(await db.getSessions());
  }, []);

  const resetAll = useCallback(async () => {
    await cancelReminders();
    await db.deleteAllData();
    setSettings(defaultSettings());
    setRoutine(null);
    setSessions([]);
  }, []);

  const value = useMemo<AppState>(
    () => ({ ready, settings, s: strings[settings.lang], routine, sessions, update, loadRoutine, logSession, removeSession, applyReminders, resetAll }),
    [ready, settings, routine, sessions, update, loadRoutine, logSession, removeSession, applyReminders, resetAll],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp outside AppProvider');
  return v;
}
