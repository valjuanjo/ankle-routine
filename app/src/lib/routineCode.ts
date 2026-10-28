// A routine travels inside its QR code, so no server is needed (plan, Step 2).
// Format: "ANK1." + base64url(UTF-8 JSON of a compact routine).
import type { RoutineItem } from './content';

export type RoutineSource = 'prescribed' | 'general' | 'team';

export interface Routine {
  source: RoutineSource;
  /** Title shown to the patient, e.g. "Routine from your physio". */
  title?: string;
  /** Stage label set by the physio, e.g. "Strength". */
  stage?: string;
  /** Weekdays, 0 = Sunday … 6 = Saturday. */
  days: number[];
  items: RoutineItem[];
  /** Short note from the visit. */
  note?: string;
  /** Who set it (physio or coach name). */
  by?: string;
  /** Date it was set, YYYY-MM-DD. */
  setOn?: string;
  /** For general programs: which program and stage it came from. */
  programId?: string;
  stageId?: string;
}

const PREFIX = 'ANK1.';
const SOURCES: Record<string, RoutineSource> = { p: 'prescribed', g: 'general', t: 'team' };
const SOURCE_KEYS: Record<RoutineSource, string> = { prescribed: 'p', general: 'g', team: 't' };
// Content limits, so a bad or tampered code can't produce a dangerous-looking routine.
const MAX_ITEMS = 20;
const MAX_SETS = 10;
const MAX_REPS = 50;
const MAX_SEC = 600;
const MAX_TEXT = 200;

type Compact = {
  s: string; t?: string; st?: string; d: number[];
  i: [string, number, number, 'r' | 's'][];
  n?: string; b?: string; o?: string;
};

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

function toBase64Url(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const n = (bytes[i] << 16) | ((bytes[i + 1] ?? 0) << 8) | (bytes[i + 2] ?? 0);
    out += B64[(n >> 18) & 63] + B64[(n >> 12) & 63];
    if (i + 1 < bytes.length) out += B64[(n >> 6) & 63];
    if (i + 2 < bytes.length) out += B64[n & 63];
  }
  return out;
}

function fromBase64Url(s: string): Uint8Array {
  const bytes: number[] = [];
  let buf = 0;
  let bits = 0;
  for (const ch of s) {
    const v = B64.indexOf(ch);
    if (v < 0) throw new RoutineCodeError('bad_characters');
    buf = (buf << 6) | v;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buf >> bits) & 0xff);
    }
  }
  return new Uint8Array(bytes);
}

export class RoutineCodeError extends Error {
  constructor(public reason: string) {
    super(`Invalid routine code: ${reason}`);
  }
}

export function encodeRoutine(r: Routine): string {
  const c: Compact = {
    s: SOURCE_KEYS[r.source],
    d: [...r.days].sort((a, b) => a - b),
    i: r.items.map((it) => (it.reps != null ? [it.ex, it.sets, it.reps, 'r'] : [it.ex, it.sets, it.sec ?? 0, 's'])),
  };
  if (r.title) c.t = r.title;
  if (r.stage) c.st = r.stage;
  if (r.note) c.n = r.note;
  if (r.by) c.b = r.by;
  if (r.setOn) c.o = r.setOn;
  return PREFIX + toBase64Url(new TextEncoder().encode(JSON.stringify(c)));
}

const text = (v: unknown, field: string): string | undefined => {
  if (v == null) return undefined;
  if (typeof v !== 'string' || v.length > MAX_TEXT) throw new RoutineCodeError(`bad_${field}`);
  return v;
};
const intIn = (v: unknown, min: number, max: number) => Number.isInteger(v) && (v as number) >= min && (v as number) <= max;

/**
 * Decodes and validates a scanned code. `knownExercises` is the bundled library;
 * a code that names an exercise the app doesn't have is rejected rather than shown half-empty.
 */
export function decodeRoutine(code: string, knownExercises: Set<string>): Routine {
  const trimmed = code.trim();
  if (!trimmed.startsWith(PREFIX)) throw new RoutineCodeError('not_a_routine_code');
  let c: Compact;
  try {
    c = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(fromBase64Url(trimmed.slice(PREFIX.length))));
  } catch (e) {
    if (e instanceof RoutineCodeError) throw e;
    throw new RoutineCodeError('unreadable');
  }
  if (!c || typeof c !== 'object') throw new RoutineCodeError('unreadable');
  const source = SOURCES[c.s];
  if (!source) throw new RoutineCodeError('bad_source');
  if (!Array.isArray(c.d) || !c.d.length || c.d.length > 7 || !c.d.every((d) => intIn(d, 0, 6)) || new Set(c.d).size !== c.d.length) {
    throw new RoutineCodeError('bad_days');
  }
  if (!Array.isArray(c.i) || !c.i.length || c.i.length > MAX_ITEMS) throw new RoutineCodeError('bad_items');
  const items: RoutineItem[] = c.i.map((row) => {
    if (!Array.isArray(row) || row.length !== 4) throw new RoutineCodeError('bad_items');
    const [ex, sets, amount, unit] = row;
    if (typeof ex !== 'string' || !knownExercises.has(ex)) throw new RoutineCodeError('unknown_exercise');
    if (!intIn(sets, 1, MAX_SETS)) throw new RoutineCodeError('bad_sets');
    if (unit === 'r' && intIn(amount, 1, MAX_REPS)) return { ex, sets, reps: amount };
    if (unit === 's' && intIn(amount, 1, MAX_SEC)) return { ex, sets, sec: amount };
    throw new RoutineCodeError('bad_amount');
  });
  const setOn = text(c.o, 'date');
  if (setOn && !/^\d{4}-\d{2}-\d{2}$/.test(setOn)) throw new RoutineCodeError('bad_date');
  return {
    source,
    title: text(c.t, 'title'),
    stage: text(c.st, 'stage'),
    days: [...c.d].sort((a, b) => a - b),
    items,
    note: text(c.n, 'note'),
    by: text(c.b, 'by'),
    setOn,
  };
}
