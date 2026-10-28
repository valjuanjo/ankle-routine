// On-device storage (SQLite). No accounts, no server: the patient owns the data (guiding rule 1).
import * as SQLite from 'expo-sqlite';
import type { Routine } from './routineCode';
import type { Day, Session } from './schedule';

let opening: Promise<SQLite.SQLiteDatabase> | null = null;
const open = () => (opening ??= SQLite.openDatabaseAsync('ankle.db'));

const SCHEMA_VERSION = 1;

export async function migrate(): Promise<void> {
  const db = await open();
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  if ((row?.user_version ?? 0) >= SCHEMA_VERSION) return;
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS routines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      json TEXT NOT NULL,
      started_on TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      day TEXT NOT NULL,
      logged_at TEXT NOT NULL,
      pain INTEGER,
      note TEXT,
      routine_id INTEGER
    );
    CREATE INDEX IF NOT EXISTS sessions_day ON sessions(day);
    PRAGMA user_version = ${SCHEMA_VERSION};
  `);
}

export async function getSettings(): Promise<Record<string, string>> {
  const db = await open();
  const rows = await db.getAllAsync<{ key: string; value: string }>('SELECT key, value FROM settings');
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

export async function setSetting(key: string, value: string): Promise<void> {
  const db = await open();
  await db.runAsync('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value', key, value);
}

export interface StoredRoutine {
  id: number;
  routine: Routine;
  startedOn: Day;
}

export async function getActiveRoutine(): Promise<StoredRoutine | null> {
  const db = await open();
  const row = await db.getFirstAsync<{ id: number; json: string; started_on: string }>(
    'SELECT id, json, started_on FROM routines WHERE active = 1 ORDER BY id DESC LIMIT 1',
  );
  return row ? { id: row.id, routine: JSON.parse(row.json), startedOn: row.started_on } : null;
}

export async function setActiveRoutine(routine: Routine, startedOn: Day): Promise<StoredRoutine> {
  const db = await open();
  let id = 0;
  await db.withTransactionAsync(async () => {
    await db.runAsync('UPDATE routines SET active = 0');
    const res = await db.runAsync('INSERT INTO routines (json, started_on, active) VALUES (?, ?, 1)', JSON.stringify(routine), startedOn);
    id = res.lastInsertRowId;
  });
  return { id, routine, startedOn };
}

type SessionRow = { id: number; day: string; logged_at: string; pain: number | null; note: string | null };
const toSession = (r: SessionRow): Session => ({ id: r.id, day: r.day, loggedAt: r.logged_at, pain: r.pain, note: r.note });

export async function getSessions(): Promise<Session[]> {
  const db = await open();
  const rows = await db.getAllAsync<SessionRow>('SELECT id, day, logged_at, pain, note FROM sessions ORDER BY logged_at DESC');
  return rows.map(toSession);
}

export async function addSession(s: Omit<Session, 'id'>, routineId: number | null): Promise<void> {
  const db = await open();
  await db.runAsync(
    'INSERT INTO sessions (day, logged_at, pain, note, routine_id) VALUES (?, ?, ?, ?, ?)',
    s.day, s.loggedAt, s.pain, s.note, routineId,
  );
}

export async function deleteSession(id: number): Promise<void> {
  const db = await open();
  await db.runAsync('DELETE FROM sessions WHERE id = ?', id);
}

export async function deleteAllData(): Promise<void> {
  const db = await open();
  await db.execAsync('DELETE FROM sessions; DELETE FROM routines; DELETE FROM settings;');
}
