/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { addDays, calendarDays, daysBetween, painTrend, toNotificationWeekday, weekday, weekStats, type Session } from '../src/lib/schedule';

const session = (day: string, pain: number | null = null, id = 0): Session => ({ id, day, loggedAt: `${day}T18:00:00.000Z`, pain, note: null });

test('day arithmetic crosses months and years', () => {
  assert.equal(addDays('2026-12-30', 3), '2027-01-02');
  assert.equal(addDays('2026-11-01', -1), '2026-10-31');
  assert.equal(daysBetween('2026-11-04', '2026-11-25'), 21);
  assert.equal(weekday('2026-11-04'), 3); // Wednesday
});

test('week-by-week completion counts planned days and distinct done days', () => {
  // Starts Wed Nov 4 2026; Mon/Wed/Fri routine.
  const sessions = [session('2026-11-04'), session('2026-11-04'), session('2026-11-06'), session('2026-11-09'), session('2026-11-12')];
  const weeks = weekStats('2026-11-04', [1, 3, 5], sessions, '2026-11-18');
  assert.deepEqual(weeks.map((w) => [w.week, w.planned, w.done]), [[1, 3, 3], [2, 3, 1], [3, 1, 0]]);
  assert.equal(weeks[2].start, '2026-11-18');
});

test('a routine started today has one week with today counted', () => {
  assert.deepEqual(weekStats('2026-11-04', [3], [], '2026-11-04').map((w) => [w.planned, w.done]), [[1, 0]]);
});

test('notification weekdays are 1 = Sunday', () => {
  assert.equal(toNotificationWeekday(0), 1);
  assert.equal(toNotificationWeekday(6), 7);
});

test('pain trend skips sessions without a score, oldest first', () => {
  assert.deepEqual(painTrend([session('2026-11-06', 2), session('2026-11-04', 4), session('2026-11-05')]), [
    { day: '2026-11-04', pain: 4 },
    { day: '2026-11-06', pain: 2 },
  ]);
});

test('calendar starts on a Sunday and ends with this week', () => {
  const days = calendarDays('2026-11-18', 3);
  assert.equal(days.length, 21);
  assert.equal(weekday(days[0]), 0);
  assert.ok(days.includes('2026-11-18'));
  assert.equal(days.at(-1), '2026-11-21');
});
