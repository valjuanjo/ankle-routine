/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { exercises, programs, teamWarmup, templates } from '../src/lib/content';
import { decodeRoutine, encodeRoutine, RoutineCodeError, type Routine } from '../src/lib/routineCode';

const KNOWN = new Set(exercises.map((e) => e.id));
const sample: Routine = {
  source: 'prescribed',
  title: 'Rutina de María',
  stage: 'Fuerza',
  days: [5, 1, 3],
  items: [{ ex: 'band_eversion', sets: 3, reps: 12 }, { ex: 'single_leg_stance', sets: 3, sec: 30 }],
  note: 'Sin dolor. Hielo si hay hinchazón — “ojo”',
  by: 'Lic. Pérez',
  setOn: '2026-11-04',
};

test('round-trips a prescribed routine, including Spanish characters', () => {
  const decoded = decodeRoutine(encodeRoutine(sample), KNOWN);
  assert.deepEqual(decoded, { ...sample, days: [1, 3, 5] });
});

test('codes are QR-friendly: URL-safe characters and short', () => {
  const code = encodeRoutine(sample);
  assert.match(code, /^ANK1\.[A-Za-z0-9_-]+$/);
  assert.ok(code.length < 600, `code length ${code.length}`);
});

test('every bundled template, program stage and the team warm-up encode and decode', () => {
  const all: Routine[] = [
    ...templates.map((t) => ({ source: 'prescribed' as const, days: t.days, items: t.items })),
    ...programs.flatMap((p) => p.stages.map((s) => ({ source: 'general' as const, days: s.days, items: s.items }))),
    { source: 'team', days: teamWarmup.days, items: teamWarmup.blocks.flatMap((b) => b.items) },
  ];
  for (const r of all) assert.deepEqual(decodeRoutine(encodeRoutine(r), KNOWN).items, r.items);
});

const reason = (fn: () => unknown) => {
  try { fn(); } catch (e) { assert.ok(e instanceof RoutineCodeError); return (e as RoutineCodeError).reason; }
  assert.fail('expected an error');
};
const raw = (obj: unknown) => 'ANK1.' + Buffer.from(JSON.stringify(obj)).toString('base64url');

test('rejects codes that are not routines or are damaged', () => {
  assert.equal(reason(() => decodeRoutine('https://example.com', KNOWN)), 'not_a_routine_code');
  assert.equal(reason(() => decodeRoutine('ANK1.@@@', KNOWN)), 'bad_characters');
  assert.equal(reason(() => decodeRoutine('ANK1.' + Buffer.from('{nope').toString('base64url'), KNOWN)), 'unreadable');
});

test('rejects unknown exercises and out-of-range doses', () => {
  const base = { s: 'p', d: [1], i: [['band_eversion', 3, 12, 'r']] };
  assert.equal(reason(() => decodeRoutine(raw({ ...base, i: [['moonwalk', 3, 12, 'r']] }), KNOWN)), 'unknown_exercise');
  assert.equal(reason(() => decodeRoutine(raw({ ...base, i: [['band_eversion', 99, 12, 'r']] }), KNOWN)), 'bad_sets');
  assert.equal(reason(() => decodeRoutine(raw({ ...base, i: [['band_eversion', 3, 999, 'r']] }), KNOWN)), 'bad_amount');
  assert.equal(reason(() => decodeRoutine(raw({ ...base, d: [1, 1] }), KNOWN)), 'bad_days');
  assert.equal(reason(() => decodeRoutine(raw({ ...base, d: [7] }), KNOWN)), 'bad_days');
  assert.equal(reason(() => decodeRoutine(raw({ ...base, s: 'x' }), KNOWN)), 'bad_source');
  assert.equal(reason(() => decodeRoutine(raw({ ...base, n: 'x'.repeat(500) }), KNOWN)), 'bad_note');
  assert.equal(reason(() => decodeRoutine(raw({ ...base, i: [] }), KNOWN)), 'bad_items');
});
