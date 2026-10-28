/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { intendedUse } from '../src/lib/content';
import { routineFromStage } from '../src/lib/format';
import { programs } from '../src/lib/content';
import { buildShareHtml, type ShareOptions } from '../src/lib/report';

const base: ShareOptions = {
  lang: 'es',
  country: 'PE',
  routine: { source: 'prescribed', days: [1, 3, 5], items: [{ ex: 'band_eversion', sets: 3, reps: 12 }], by: 'Lic. Pérez' },
  sessions: [
    { id: 1, day: '2026-11-04', loggedAt: '2026-11-04T23:00:00Z', pain: 7, note: 'molestia <b>leve</b>' },
    { id: 2, day: '2026-11-06', loggedAt: '2026-11-06T23:00:00Z', pain: null, note: null },
  ],
  weeks: [{ week: 1, start: '2026-11-04', end: '2026-11-10', planned: 3, done: 2 }],
  includePain: true,
  includeNotes: true,
  createdOn: '2026-11-11',
};

test('always carries the "no one is monitoring" notice and emergency numbers', () => {
  const html = buildShareHtml(base);
  assert.ok(html.includes(intendedUse.shareNotice.es));
  assert.ok(html.includes('106'));
  assert.ok(buildShareHtml({ ...base, lang: 'en', country: 'US' }).includes(intendedUse.shareNotice.en));
});

test('escapes patient text', () => {
  const html = buildShareHtml(base);
  assert.ok(html.includes('molestia &lt;b&gt;leve&lt;/b&gt;'));
  assert.ok(!html.includes('<b>leve</b>'));
});

test('leaves out pain scores and notes when the patient turns them off', () => {
  const html = buildShareHtml({ ...base, includePain: false, includeNotes: false });
  assert.ok(!html.includes('molestia'));
  assert.ok(!html.includes('Dolor 0–10'));
  assert.ok(!html.includes('<td>7</td>'));
});

test('includes only the sessions passed in', () => {
  const html = buildShareHtml({ ...base, sessions: base.sessions.slice(1) });
  assert.ok(!html.includes('molestia'));
  assert.ok(html.includes('Sesiones (1)'));
});

test('names bundled programs in the chosen language', () => {
  const p = programs[0];
  const html = buildShareHtml({ ...base, lang: 'en', routine: routineFromStage(p.id, p.stages[0]) });
  assert.ok(html.includes(p.name.en));
  assert.ok(html.includes(p.stages[0].name.en));
});
